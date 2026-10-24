import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.github_service import parse_and_validate_github_url
from app.services.workspace_service import sanitize_relative_path


def test_github_url_validation():
    # Valid URLs
    owner, repo, branch = parse_and_validate_github_url("https://github.com/torvalds/linux")
    assert owner == "torvalds"
    assert repo == "linux"
    assert branch is None

    owner, repo, branch = parse_and_validate_github_url("https://github.com/psf/requests.git")
    assert owner == "psf"
    assert repo == "requests"

    owner, repo, branch = parse_and_validate_github_url("https://github.com/Karnik007/task-manager-ai-testing/tree/main")
    assert owner == "Karnik007"
    assert repo == "task-manager-ai-testing"
    assert branch == "main"

    # Invalid URLs (SSRF / invalid hosts)
    with pytest.raises(ValueError, match="Only 'github.com' is allowed"):
        parse_and_validate_github_url("https://evil.com/owner/repo")

    with pytest.raises(ValueError, match="Only 'github.com' is allowed"):
        parse_and_validate_github_url("https://169.254.169.254/latest/meta-data")

    with pytest.raises(ValueError, match="Must use https"):
        parse_and_validate_github_url("ftp://github.com/owner/repo")

    with pytest.raises(ValueError, match="Expected format"):
        parse_and_validate_github_url("https://github.com/single-part")


def test_sanitize_relative_path():
    assert sanitize_relative_path("backend/main.py") == "backend/main.py"
    assert sanitize_relative_path("a\\b\\c.py") == "a/b/c.py"

    # Path traversal rejection
    with pytest.raises(ValueError, match="Path traversal"):
        sanitize_relative_path("../secret.env")

    with pytest.raises(ValueError, match="Path traversal"):
        sanitize_relative_path("foo/../../etc/passwd")

    with pytest.raises(ValueError, match="Absolute paths"):
        sanitize_relative_path("/etc/shadow")

    with pytest.raises(ValueError, match="Absolute paths"):
        sanitize_relative_path("C:\\Windows\\System32")


@pytest.mark.asyncio
async def test_projects_and_files_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create project
        create_resp = await client.post(
            "/api/v1/projects",
            json={"name": "Test Project", "description": "Pytest workspace", "source_type": "managed"},
        )
        assert create_resp.status_code == 201
        project_data = create_resp.json()
        project_id = project_data["id"]

        # 2. List projects
        list_resp = await client.get("/api/v1/projects")
        assert list_resp.status_code == 200
        assert any(p["id"] == project_id for p in list_resp.json()["projects"])

        # 3. Create file
        file_resp = await client.post(
            f"/api/v1/projects/{project_id}/files",
            json={"path": "src/main.py", "content": "def hello():\n    return 'world'\n"},
        )
        assert file_resp.status_code == 201
        assert file_resp.json()["path"] == "src/main.py"

        # 4. Get file content
        content_resp = await client.get(
            f"/api/v1/projects/{project_id}/files/content",
            params={"path": "src/main.py"},
        )
        assert content_resp.status_code == 200
        assert "def hello():" in content_resp.json()["content"]
        version = content_resp.json()["version"]

        # 5. Save modified content
        save_resp = await client.put(
            f"/api/v1/projects/{project_id}/files/content",
            json={"path": "src/main.py", "content": "def hello():\n    return 'updated'\n", "version": version},
        )
        assert save_resp.status_code == 200
        assert save_resp.json()["version"] == version + 1

        # 6. Test conflict detection (stale version)
        conflict_resp = await client.put(
            f"/api/v1/projects/{project_id}/files/content",
            json={"path": "src/main.py", "content": "stale edit", "version": version},
        )
        assert conflict_resp.status_code == 409

        # 7. Rename file
        rename_resp = await client.patch(
            f"/api/v1/projects/{project_id}/files/rename",
            json={"old_path": "src/main.py", "new_path": "src/app.py"},
        )
        assert rename_resp.status_code == 200
        assert rename_resp.json()["new_path"] == "src/app.py"

        # 8. Check file tree
        tree_resp = await client.get(f"/api/v1/projects/{project_id}/files")
        assert tree_resp.status_code == 200
        tree = tree_resp.json()
        assert len(tree) >= 1

        # 9. Delete file
        delete_file_resp = await client.delete(
            f"/api/v1/projects/{project_id}/files",
            params={"path": "src/app.py"},
        )
        assert delete_file_resp.status_code == 200

        # 10. Delete project
        del_proj_resp = await client.delete(f"/api/v1/projects/{project_id}")
        assert del_proj_resp.status_code == 204

import React from 'react';
import ProjectExplorer from '../components/layout/ProjectExplorer';
import EditorTabs from '../components/editor/EditorTabs';
import CodeEditor from '../components/editor/CodeEditor';
import BottomPanel from '../components/console/BottomPanel';
import AISidebar from '../components/ai/AISidebar';

export default function IDEPage() {
  return (
    <div className="ide-workspace">
      {/* 1. Left: Project Explorer */}
      <ProjectExplorer />

      {/* 2. Center: Code Editor + Bottom Developer Console */}
      <div className="center-work-area">
        {/* Editor File Tabs */}
        <EditorTabs />

        {/* Central Monaco Code Editor & Inline Popup */}
        <CodeEditor />

        {/* Bottom Developer Console */}
        <BottomPanel />
      </div>

      {/* 3. Right: Contextual AI Sidebar */}
      <AISidebar />
    </div>
  );
}

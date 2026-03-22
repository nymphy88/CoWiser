import React, { useState } from 'react';

// คุณสามารถย้าย Logic การทำงานมาไว้ในนี้ได้
function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">
            <i className="fas fa-microchip mr-2"></i>
            ContextWhisper
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Smart Summarizer</h2>
          
          {/* Drop Zone ตัวอย่าง */}
          <div className="file-drop-zone border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer">
            <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
          </div>

          <div className="mt-8 markdown-body text-left">
            <h3>วิธีการใช้งาน</h3>
            <ul>
              <li>อัปโหลดไฟล์ PDF หรือข้อความ</li>
              <li>รอให้ระบบวิเคราะห์เนื้อหา</li>
              <li>รับบทสรุปอัจฉริยะได้ทันที</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-gray-500 text-sm">
        &copy; 2026 ContextWhisper - Powered by Gemini
      </footer>
    </div>
  );
}

export default App;
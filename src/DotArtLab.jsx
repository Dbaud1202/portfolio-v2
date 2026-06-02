import React, { useState, useRef } from 'react';
import { DOT_ART_TEMPLATES } from './dotArtData';

const ASCII_CHARS = " .:-=+*#%@";

export default function DotArtLab({ lang }) {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'converter'
  const [artText, setArtText] = useState("");
  const [imageSize, setImageSize] = useState(60);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const convertImageToAscii = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        const width = imageSize;
        const ratio = img.height / img.width;
        const height = Math.floor(width * ratio * 0.5); // 0.5 because characters are roughly twice as tall as they are wide
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        let asciiStr = "";
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          if (a === 0) {
            asciiStr += " "; // Transparent
          } else {
            // Brightness
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            // Map to char index (inverted for light background by default, or regular for dark)
            // Let's make it standard: dark pixels -> darker characters
            const charIdx = Math.floor((1 - brightness) * (ASCII_CHARS.length - 1));
            asciiStr += ASCII_CHARS[charIdx];
          }
          
          if ((i / 4 + 1) % width === 0) {
            asciiStr += "\\n";
          }
        }
        
        setArtText(asciiStr);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      convertImageToAscii(e.target.files[0]);
    }
  };

  return (
    <div className="dotart-container">
      <div className="dotart-header">
        <h3>{lang === 'ko' ? "도트아트 / 아스키아트" : "DOT ART / ASCII ART"}</h3>
        <div className="dotart-tabs">
          <button 
            className={activeTab === 'templates' ? 'active' : ''} 
            onClick={() => setActiveTab('templates')}
          >
            {lang === 'ko' ? "템플릿" : "Templates"}
          </button>
          <button 
            className={activeTab === 'converter' ? 'active' : ''} 
            onClick={() => setActiveTab('converter')}
          >
            {lang === 'ko' ? "이미지 변환" : "Converter"}
          </button>
        </div>
      </div>

      {activeTab === 'templates' && (
        <div className="dotart-templates">
          {DOT_ART_TEMPLATES.map(tpl => (
            <div key={tpl.id} className="dotart-card" onClick={() => handleCopy(tpl.art)}>
              <div className="dotart-preview">
                <pre>{tpl.art}</pre>
              </div>
              <div className="dotart-info">
                <span>{tpl.title[lang] || tpl.title.en}</span>
                <span className="copy-hint">{lang === 'ko' ? "클릭해서 복사" : "Click to copy"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'converter' && (
        <div className="dotart-converter">
          <div className="converter-controls">
            <label className="file-upload-btn">
              {lang === 'ko' ? "이미지 업로드" : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleFileChange} hidden />
            </label>
            <div className="size-slider">
              <label>{lang === 'ko' ? "가로 크기 (해상도): " : "Width: "}{imageSize}</label>
              <input 
                type="range" 
                min="20" 
                max="120" 
                value={imageSize} 
                onChange={(e) => setImageSize(parseInt(e.target.value))}
              />
            </div>
            {artText && (
              <button className="copy-btn" onClick={() => handleCopy(artText)}>
                {lang === 'ko' ? "결과 복사하기" : "Copy Result"}
              </button>
            )}
          </div>
          
          <div className="converter-result">
            {artText ? (
              <pre className="ascii-output">{artText}</pre>
            ) : (
              <div className="empty-state">
                {lang === 'ko' ? "이미지를 업로드하면 아스키 아트로 변환됩니다." : "Upload an image to see it converted to ASCII art."}
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div>
      )}
      
      {copied && (
        <div className="copy-toast">
          {lang === 'ko' ? "클립보드에 복사되었습니다!" : "Copied to clipboard!"}
        </div>
      )}
    </div>
  );
}

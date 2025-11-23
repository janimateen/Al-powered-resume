import React, { useState, useRef } from 'react';
import ReactJson from 'react-json-view';
import axios from 'axios';
import sample from '../sample-resume.json';

export default function App() {
  const [resume, setResume] = useState(sample);
  const [htmlPreview, setHtmlPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

  // Build a simple HTML from resume JSON (server and client should share template ideally)
  const buildHtml = (r) => {
    // Simple, clean responsive template — extend as needed
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${r.basics.name} — Resume</title>
<style>
  body{font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial; color:#111; padding:24px;}
  .container{max-width:800px;margin:0 auto;}
  header{display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #eee; padding-bottom:12px; margin-bottom:18px;}
  h1{margin:0;font-size:26px;}
  .contact{font-size:12px;color:#666;}
  section{margin-bottom:14px;}
  h2{margin:0 0 6px 0;font-size:16px;color:#222;border-left:3px solid #0077cc;padding-left:8px;}
  ul{margin:6px 0 0 18px;}
  .skill{display:inline-block;margin-right:8px;padding:2px 8px;border-radius:12px;background:#f1f1f1;font-size:12px;}
</style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>${escapeHtml(r.basics.name || '')}</h1>
        <div class="contact">${escapeHtml(r.basics.label || '')} &nbsp;•&nbsp; ${escapeHtml(r.basics.email || '')}</div>
      </div>
      <div style="text-align:right;">
        <div>${escapeHtml(r.basics.location?.city || '')}</div>
        <div style="font-size:12px;color:#666">${escapeHtml(r.basics.website || '')}</div>
      </div>
    </header>

    <section>
      <h2>Summary</h2>
      <p>${escapeHtml(r.basics.summary || '')}</p>
    </section>

    <section>
      <h2>Experience</h2>
      ${ (r.work || []).map(w => `
        <div style="margin-bottom:8px">
          <strong>${escapeHtml(w.position || '')}</strong> — ${escapeHtml(w.company || '')} <span style="color:#666; font-size:12px">(${escapeHtml(w.startDate||'')} — ${escapeHtml(w.endDate||'Present')})</span>
          <div style="font-size:14px">${escapeHtml(w.summary||'')}</div>
          ${ (w.highlights || []).length ? `<ul>${w.highlights.map(h=>`<li>${escapeHtml(h)}</li>`).join('')}</ul>` : '' }
        </div>
      `).join('')}
    </section>

    <section>
      <h2>Education</h2>
      ${ (r.education || []).map(e => `
        <div style="margin-bottom:8px">
          <strong>${escapeHtml(e.institution||'')}</strong> — ${escapeHtml(e.studyType||'')} <span style="color:#666; font-size:12px">(${escapeHtml(e.startDate||'')} — ${escapeHtml(e.endDate||'')})</span>
          <div style="font-size:14px">${escapeHtml(e.area||'')}</div>
        </div>
      `).join('')}
    </section>

    <section>
      <h2>Skills</h2>
      <div>${ (r.skills||[]).map(s=>`<span class="skill">${escapeHtml(s.name)}</span>`).join(' ') }</div>
    </section>
  </div>
</body>
</html>`;

    function escapeHtml(text){
      if(!text) return '';
      return String(text)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#039;');
    }
  };

  const updateResume = (r) => {
    setResume(r);
    setHtmlPreview(buildHtml(r));
  };

  // init preview
  React.useEffect(()=> {
    setHtmlPreview(buildHtml(resume));
  }, []);

  const exportPDF = async () => {
    setLoading(true);
    try {
      const html = buildHtml(resume);
      const resp = await axios.post(`${serverUrl}/export`, { html }, { responseType: 'arraybuffer' });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.basics?.name || 'resume'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <aside className="left">
        <h3>JSON Resume Editor</h3>
        <div style={{height: '70vh', overflow: 'auto', border:'1px solid #eee', padding:8, borderRadius:6, background:'#fafafa'}}>
          <ReactJson
            src={resume}
            onEdit={(e)=> updateResume(e.updated_src)}
            onAdd={(e)=> updateResume(e.updated_src)}
            onDelete={(e)=> updateResume(e.updated_src)}
            collapseStringsAfterLength={200}
            displayDataTypes={false}
            name={false}
          />
        </div>

        <div style={{marginTop:12, display:'flex', gap:8}}>
          <button onClick={()=>{ setResume(sample); setHtmlPreview(buildHtml(sample)); }} className="btn">Reset sample</button>
          <button onClick={exportPDF} className="btn primary" disabled={loading}>{loading ? 'Exporting...' : 'Export PDF'}</button>
        </div>
      </aside>

      <main className="right">
        <h3>Preview</h3>
        <iframe title="preview" srcDoc={htmlPreview} style={{width:'100%',height:'80vh',border:'1px solid #ddd', borderRadius:6}} />
      </main>
    </div>
  );
}

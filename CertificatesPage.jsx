import React, { useState, useEffect } from 'react';
import { Award, Download } from 'lucide-react';
import { colors, Spinner } from './Shared.jsx';
import { api } from '../api.js';

export default function CertificatesPage() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCertificates().then(res => setCerts(res.certificates)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 16px 60px' }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: colors.ink, margin: '0 0 6px' }}>
        Your Certificates
      </h2>
      <p style={{ color: colors.muted, fontSize: 14, margin: '0 0 24px' }}>
        Sprachstufe practice certificates earned by passing mock exams. These reflect performance on our
        practice tests, not official Goethe/telc/TestDaF/DELF credentials.
      </p>

      {certs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.muted }}>
          <Award size={36} color={colors.faint} style={{ marginBottom: 12 }} />
          <p>No certificates yet. Pass a mock exam to earn your first one.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {certs.map(cert => (
          <div key={cert.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
            borderRadius: 14, border: `1px solid ${colors.border}`, background: '#fff',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${colors.gold},${colors.red})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Award size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: colors.ink }}>
                {cert.certificateType} — Level {cert.levelCode}
              </div>
              <div style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>
                Score: {cert.scorePercent}% · Issued {new Date(cert.issuedAt).toLocaleDateString()}
              </div>
            </div>
            <a
              href={api.certificateDownloadUrl(cert.id)}
              target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
                background: colors.ink, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
              }}
            >
              <Download size={14} /> PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

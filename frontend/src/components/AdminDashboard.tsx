import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalUsers: number;
  totalTranslations: number;
  totalVotes: number;
  totalEdits: number;
}

interface Vote {
  id: number;
  voteType: string;
  createdAt: string;
  history: {
    originalText: string;
    translatedText: string;
  }
}

interface Edit {
  id: number;
  suggestedTranslation: string;
  createdAt: string;
  history: {
    originalText: string;
    translatedText: string;
  }
}

interface Feedback {
  recentVotes: Vote[];
  recentEdits: Edit[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ROLE_ADMIN') return;

    const fetchData = async () => {
      try {
        const [statsRes, feedbackRes] = await Promise.all([
          fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${user.accessToken}` }
          }),
          fetch('/api/admin/recent-feedback', {
            headers: { 'Authorization': `Bearer ${user.accessToken}` }
          })
        ]);

        if (!statsRes.ok || !feedbackRes.ok) {
          throw new Error('Không thể tải dữ liệu. Bạn có chắc mình là Admin?');
        }

        setStats(await statsRes.json());
        setFeedback(await feedbackRes.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user || user.role !== 'ROLE_ADMIN') {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}><h2>Access Denied</h2><p>Bạn không có quyền truy cập trang này.</p></div>;
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải dữ liệu Admin...</div>;
  if (error) return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>Lỗi: {error}</div>;

  // Prepare data for charts
  const upvotes = feedback?.recentVotes.filter(v => v.voteType === 'UPVOTE').length || 0;
  const downvotes = feedback?.recentVotes.filter(v => v.voteType === 'DOWNVOTE').length || 0;
  
  const voteChartData = [
    { name: 'Tốt (Upvote)', value: upvotes },
    { name: 'Chưa tốt (Downvote)', value: downvotes }
  ];
  const COLORS = ['#4caf50', '#f44336'];

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', color: '#333' }}>
      <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #0056b3', paddingBottom: '10px' }}>👑 Admin Dashboard</h2>
      
      {/* Overview Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <StatCard title="Người dùng" value={stats?.totalUsers || 0} icon="👥" color="#2196f3" />
        <StatCard title="Lượt dịch" value={stats?.totalTranslations || 0} icon="🌐" color="#ff9800" />
        <StatCard title="Đánh giá" value={stats?.totalVotes || 0} icon="⭐" color="#9c27b0" />
        <StatCard title="Đề xuất sửa" value={stats?.totalEdits || 0} icon="✏️" color="#00bcd4" />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Tỷ lệ Đánh giá (Gần đây)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={voteChartData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                {voteChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Tables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Recent Downvotes */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#d32f2f' }}>👎 Các câu bị Downvote gần đây (Cần cải thiện AI)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px' }}>Câu gốc</th>
                <th style={{ padding: '12px' }}>Máy dịch</th>
                <th style={{ padding: '12px' }}>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {feedback?.recentVotes.filter(v => v.voteType === 'DOWNVOTE').map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{v.history?.originalText}</td>
                  <td style={{ padding: '12px' }}>{v.history?.translatedText}</td>
                  <td style={{ padding: '12px' }}>{new Date(v.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {feedback?.recentVotes.filter(v => v.voteType === 'DOWNVOTE').length === 0 && (
                <tr><td colSpan={3} style={{ padding: '12px', textAlign: 'center' }}>Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Edits */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#1976d2' }}>✏️ Các đề xuất dịch tốt hơn từ cộng đồng</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px' }}>Câu gốc</th>
                <th style={{ padding: '12px' }}>Máy dịch (Cũ)</th>
                <th style={{ padding: '12px', color: '#2e7d32' }}>Người dùng đề xuất</th>
              </tr>
            </thead>
            <tbody>
              {feedback?.recentEdits.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{e.history?.originalText}</td>
                  <td style={{ padding: '12px', color: '#757575', textDecoration: 'line-through' }}>{e.history?.translatedText}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#2e7d32' }}>{e.suggestedTranslation}</td>
                </tr>
              ))}
              {feedback?.recentEdits.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '12px', textAlign: 'center' }}>Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) {
  return (
    <div style={{ 
      flex: '1 1 200px', 
      background: '#fff', 
      padding: '20px', 
      borderRadius: '12px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      borderLeft: `5px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    }}>
      <div style={{ fontSize: '2.5rem' }}>{icon}</div>
      <div>
        <div style={{ color: '#666', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333' }}>{value.toLocaleString()}</div>
      </div>
    </div>
  );
}

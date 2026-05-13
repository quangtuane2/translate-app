import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css'; // Reusing some CSS

interface FeedbackModalProps {
  historyId: number | string;
  onClose: () => void;
  onSuccess?: () => void;
  type: 'EDIT' | 'VOTE';
}

export default function FeedbackModal({ historyId, onClose, onSuccess, type }: FeedbackModalProps) {
  const [suggestedText, setSuggestedText] = useState('');
  const [voteType, setVoteType] = useState<'UPVOTE' | 'DOWNVOTE'>('UPVOTE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const url = type === 'EDIT' ? '/api/feedback/edit' : '/api/feedback/vote';
    const body = type === 'EDIT' 
      ? { historyId: Number(historyId), suggestedTranslation: suggestedText }
      : { historyId: Number(historyId), voteType };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken}`
        },
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Lỗi xử lý');

      setSuccess('Cảm ơn bạn đã đóng góp!');
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>{type === 'EDIT' ? 'Đề xuất bản dịch' : 'Đánh giá bản dịch'}</h2>
        
        {success ? (
          <div style={{ color: 'green', textAlign: 'center', margin: '20px 0' }}>{success}</div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {type === 'EDIT' ? (
              <div className="form-group">
                <label>Bản dịch của bạn</label>
                <textarea 
                  value={suggestedText} 
                  onChange={e => setSuggestedText(e.target.value)} 
                  required 
                  rows={4}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
                  placeholder="Nhập bản dịch tốt hơn..."
                />
              </div>
            ) : (
              <div className="form-group" style={{ display: 'flex', gap: 20, justifyContent: 'center', margin: '20px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                  <input type="radio" name="vote" checked={voteType === 'UPVOTE'} onChange={() => setVoteType('UPVOTE')} />
                  👍 Tốt
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                  <input type="radio" name="vote" checked={voteType === 'DOWNVOTE'} onChange={() => setVoteType('DOWNVOTE')} />
                  👎 Chưa tốt
                </label>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi đóng góp'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

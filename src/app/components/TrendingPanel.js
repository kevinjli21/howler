'use client';
import { useEffect, useState } from 'react';
import { ensureContrast } from '@/utils/color';

export default function TrendingPanel() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trending')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTrending(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="trending-column">
      <div className="trending-card">
        <h2 className="trending-heading">Trending on Howler</h2>

        {loading && (
          <p className="trending-empty">Loading...</p>
        )}

        {!loading && trending.length === 0 && (
          <p className="trending-empty">No trending topics yet — check back later.</p>
        )}

        {trending.map((item, i) => {
          const safeColor = ensureContrast(item.color, '#ffffff', 4.5);
          return (
            <div key={item.id} className="trending-row">
              <span className="trending-rank">{i + 1}</span>
              <div className="trending-info">
                <span
                  className="trending-badge"
                  style={{ backgroundColor: safeColor }}
                >
                  {item.category_name}
                </span>
                <span className="trending-count">
                  {item.post_count} {item.post_count === 1 ? 'post' : 'posts'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

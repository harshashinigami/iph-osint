import { useEffect, useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { getPosts } from '../api/endpoints';
import type { PostItem } from '../types';

const PLATFORMS = ['all', 'rss', 'telegram', 'twitter', 'reddit'] as const;
type PlatformFilter = typeof PLATFORMS[number];

const PLATFORM_BADGE: Record<string, string> = {
  rss:      'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20',
  telegram: 'bg-blue-400/10 text-blue-400 border border-blue-400/20',
  twitter:  'bg-violet-400/10 text-violet-400 border border-violet-400/20',
  reddit:   'bg-orange-400/10 text-orange-400 border border-orange-400/20',
};

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${PLATFORM_BADGE[platform] || 'bg-slate-500/20 text-slate-400 border border-slate-500/20'}`}>
      {platform}
    </span>
  );
}

function PostCard({ post, query }: { post: PostItem; query: string }) {
  const highlight = (text: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-cyan-400/20 text-cyan-300 rounded-sm">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.12)] rounded-xl p-4 hover:border-[rgba(0,240,255,0.35)] transition-colors" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={post.platform} />
          {post.author_name && (
            <span className="text-sm text-[#e2f0ff] font-medium">{post.author_name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {post.is_processed ? (
            <span className="text-xs text-emerald-400 font-mono">processed</span>
          ) : (
            <span className="text-xs text-slate-600 font-mono">unprocessed</span>
          )}
          <span className="text-xs text-slate-500 font-mono">{new Date(post.collected_at).toLocaleString()}</span>
        </div>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
        {highlight(post.content)}
      </p>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    getPosts({ platform: platform === 'all' ? undefined : platform, limit: 100 })
      .then((res) => {
        setPosts(res.data);
        setFetched(true);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [platform]);

  // Fetch when platform filter changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filtered = query.trim()
    ? posts.filter((p) => p.content.toLowerCase().includes(query.toLowerCase()) ||
        (p.author_name || '').toLowerCase().includes(query.toLowerCase()))
    : posts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Search</h1>
        <span className="text-xs text-slate-500 font-mono">{fetched ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : ''}</span>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts by content or author..."
          className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(0,240,255,0.15)] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
        )}
      </div>

      {/* Platform filter chips */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-cyan-400/70">Platform:</span>
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
              platform === p
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                : 'bg-[rgba(0,240,255,0.03)] text-slate-400 border border-[rgba(0,240,255,0.12)] hover:border-[rgba(0,240,255,0.3)] hover:text-slate-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && !fetched ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 flex items-center gap-2 font-mono text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            Loading posts...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Search className="w-10 h-10 mb-3 opacity-30 text-cyan-400" />
          <p className="text-sm font-mono">{query ? `No posts matching "${query}"` : 'No posts found'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}

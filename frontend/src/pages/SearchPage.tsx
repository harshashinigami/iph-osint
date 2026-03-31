import { useEffect, useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { getPosts } from '../api/endpoints';
import type { PostItem } from '../types';

const PLATFORMS = ['all', 'rss', 'telegram', 'twitter', 'reddit'] as const;
type PlatformFilter = typeof PLATFORMS[number];

const PLATFORM_BADGE: Record<string, string> = {
  rss:      'bg-blue-500/20 text-blue-400',
  telegram: 'bg-cyan-500/20 text-cyan-400',
  twitter:  'bg-violet-500/20 text-violet-400',
  reddit:   'bg-orange-500/20 text-orange-400',
};

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${PLATFORM_BADGE[platform] || 'bg-slate-500/20 text-slate-400'}`}>
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
        <mark className="bg-yellow-400/30 text-yellow-300 rounded-sm">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={post.platform} />
          {post.author_name && (
            <span className="text-sm text-slate-300 font-medium">{post.author_name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {post.is_processed ? (
            <span className="text-xs text-emerald-500">processed</span>
          ) : (
            <span className="text-xs text-slate-600">unprocessed</span>
          )}
          <span className="text-xs text-slate-500">{new Date(post.collected_at).toLocaleString()}</span>
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
        <span className="text-xs text-slate-500">{fetched ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : ''}</span>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts by content or author..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Platform filter chips */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Platform:</span>
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              platform === p
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && !fetched ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading posts...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Search className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">{query ? `No posts matching "${query}"` : 'No posts found'}</p>
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

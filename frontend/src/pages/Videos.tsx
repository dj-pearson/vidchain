import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVideos, useDeleteVideo } from '@/hooks';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { SkeletonVideoCard } from '@/components/ui/Skeleton';
import { ROUTES } from '@/config/constants';
import {
  formatRelativeTime,
  formatFileSize,
  formatDuration,
  truncate,
  getStatusBadgeVariant,
} from '@/lib/utils';
import {
  Video,
  Upload,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  Shield,
  CheckCircle,
} from 'lucide-react';
import type { Video as VideoType } from '@/types';

export function Videos() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useVideos({ page, per_page: 12 });
  const deleteVideo = useDeleteVideo();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleDelete = async (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      await deleteVideo.mutateAsync(videoId);
    }
    setMenuOpen(null);
  };

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">Error loading videos</p>
      </div>
    );
  }

  const filteredVideos = data?.data.filter((video) =>
    video.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-muted-foreground">
            {data?.total || 0} videos uploaded
          </p>
        </div>
        <Link to={ROUTES.upload}>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonVideoCard key={i} />
          ))}
        </div>
      ) : filteredVideos?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Video className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No videos yet</h2>
            <p className="mt-2 text-muted-foreground">
              Upload your first video to get started
            </p>
            <Link to={ROUTES.upload} className="mt-4">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos?.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isMenuOpen={menuOpen === video.id}
                onMenuToggle={() => setMenuOpen(menuOpen === video.id ? null : video.id)}
                onDelete={() => handleDelete(video.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.total_pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface VideoCardProps {
  video: VideoType;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onDelete: () => void;
}

function VideoCard({ video, isMenuOpen, onMenuToggle, onDelete }: VideoCardProps) {
  return (
    <Card className="group overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Duration overlay */}
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Link to={ROUTES.video(video.id)}>
            <Button size="sm" variant="secondary">
              <Eye className="mr-1 h-4 w-4" />
              View
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to={ROUTES.video(video.id)}
              className="font-medium hover:underline"
            >
              {truncate(video.title, 40)}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatFileSize(video.file_size)} &middot; {video.resolution}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(video.created_at)}
            </p>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={onMenuToggle}
              className="rounded p-1 hover:bg-accent"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={onMenuToggle} />
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border bg-popover p-1 shadow-lg">
                  <Link
                    to={ROUTES.video(video.id)}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                    onClick={onMenuToggle}
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                    onClick={onMenuToggle}
                  >
                    <Shield className="h-4 w-4" />
                    Verify
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(video.status)}>
            {video.status === 'ready' && <CheckCircle className="mr-1 h-3 w-3" />}
            {video.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

"use client"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  Play, 
  Square, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Activity,
  Eye
} from "lucide-react";
import { toast } from "sonner";

interface ProcessingJob {
  id: string;
  audiobookId: string;
  jobType: string;
  status: string;
  progress: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
  metadata?: {
    fileName?: string;
    phase?: string;
    message?: string;
    chunksProcessed?: number;
    totalChunks?: number;
    currentChunk?: string;
    [key: string]: unknown;
  };
  audiobook: {
    title: string;
    author: string;
    fileName: string;
  };
}

interface JobsResponse {
  jobs: ProcessingJob[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  statistics: Record<string, number>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    default:
      return <Activity className="h-4 w-4 text-blue-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "downloading":
    case "chunking":
    case "transcribing":
    case "generating_content":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function ProcessingJobsList() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [statistics, setStatistics] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("status", filter);
      }
      params.set("limit", "20");

      const response = await fetch(`/api/admin/jobs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");

      const data: JobsResponse = await response.json();
      setJobs(data.jobs);
      setStatistics(data.statistics);
    } catch (error) {
      toast.error("Failed to fetch processing jobs");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const retryJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to retry job");
      }

      toast.success("Job retry initiated");
      fetchJobs(); // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to retry job");
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel job");
      }

      toast.success("Job cancelled successfully");
      fetchJobs(); // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel job");
    }
  };


  useEffect(() => {
    fetchJobs();
    
    // Auto-refresh every 30 seconds for active jobs
    const interval = setInterval(() => {
      const hasActiveJobs = jobs.some(job => 
        ["pending", "downloading", "chunking", "transcribing", "generating_content"].includes(job.status)
      );
      if (hasActiveJobs) {
        fetchJobs();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchJobs, jobs]);

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = end - start;
    
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const filteredJobs = jobs.filter(job => filter === "all" || job.status === filter);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(statistics).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getStatusIcon(status)}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "pending", "processing", "completed", "failed"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === "processing" ? "Active" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
        
        <Button variant="outline" size="sm" onClick={fetchJobs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="text-4xl">📋</div>
                <h3 className="text-lg font-semibold">No processing jobs found</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === "all" ? "No jobs have been created yet." : `No ${filter} jobs found.`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {job.audiobook.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      by {job.audiobook.author} • {job.metadata?.fileName || 'unknown file'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(job.status)}>
                      {getStatusIcon(job.status)}
                      <span className="ml-1">{job.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                {job.status !== "completed" && job.status !== "failed" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>
                )}

                {/* Error Message */}
                {job.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Error</p>
                        <p className="text-xs text-red-700">{job.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Details */}
                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Started:</span>{" "}
                    {new Date(job.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>{" "}
                    {formatDuration(job.createdAt, job.completedAt)}
                  </div>
                </div>

                {/* Current Phase Info */}
                {job.metadata?.phase && job.status === "processing" && (
                  <div className="text-sm">
                    <span className="font-medium">Current step:</span>{" "}
                    <span className="text-blue-600 font-medium capitalize">{job.metadata.phase.replace('_', ' ')}</span>
                    <br />
                    <span className="text-muted-foreground">{job.metadata.message}</span>
                    {job.metadata.chunksProcessed && job.metadata.totalChunks && (
                      <span className="text-muted-foreground">
                        {" "}({job.metadata.chunksProcessed}/{job.metadata.totalChunks} chunks)
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {job.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryJob(job.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                  
                  {["pending", "downloading", "chunking", "transcribing", "generating_content"].includes(job.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelJob(job.id)}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {selectedJob === job.id ? "Hide" : "Details"}
                  </Button>
                </div>

                {/* Expanded Details */}
                {selectedJob === job.id && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Job Metadata</h4>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
                      {JSON.stringify(job.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
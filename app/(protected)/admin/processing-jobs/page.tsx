import { ProcessingJobsList } from "@/components/admin/processing/processing-jobs-list";

export default function ProcessingJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Processing Jobs</h1>
        <p className="text-muted-foreground">
          Monitor and manage audiobook processing jobs
        </p>
      </div>
      
      <ProcessingJobsList />
    </div>
  );
}
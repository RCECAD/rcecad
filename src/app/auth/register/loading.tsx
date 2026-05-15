import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div>
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto mb-8" />

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item}>
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-10" />
                </div>
              ))}
            </div>

            <Skeleton className="h-10 mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

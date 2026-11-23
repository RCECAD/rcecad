import { AuthSkeleton } from "@/components/ui/loading-skeletons";

export default function RegisterLoading() {
  return <AuthSkeleton fields={5} />;
}

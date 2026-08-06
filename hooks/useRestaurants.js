import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRestaurants, syncRestaurants } from "@/services/frontend/restaurantService";

export function useRestaurants() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["restaurants"],
    queryFn: fetchRestaurants,
  });

  const syncMutation = useMutation({
    mutationFn: (accountKey) => syncRestaurants(accountKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });

  return {
    restaurants: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  };
}

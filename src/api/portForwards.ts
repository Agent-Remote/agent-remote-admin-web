import type { ApiResponse, AppRequest, ListData, PortForward } from "../types";

export async function listPortForwards(
  request: AppRequest,
  allUsers: boolean
): Promise<PortForward[]> {
  const path = allUsers ? "/port-forwards?all_users=true" : "/port-forwards";
  const response = await request<ApiResponse<ListData<PortForward>>>(path);
  return response.data.items;
}

export async function stopPortForward(
  request: AppRequest,
  forwardId: string
): Promise<PortForward> {
  const response = await request<ApiResponse<PortForward>>(`/port-forwards/${forwardId}`, {
    method: "DELETE"
  });
  return response.data;
}

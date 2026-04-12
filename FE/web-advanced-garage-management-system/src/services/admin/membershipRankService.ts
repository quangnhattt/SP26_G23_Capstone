import AxiosClient from "@/apis/AxiosClient";

export interface IMembershipRank {
  rankID: number;
  rankName: string;
  minSpending: number;
  discountPercent: number;
  description: string | null;
  isActive: boolean;
}

export interface IMembershipRankRequest {
  rankName: string;
  minSpending: number;
  discountPercent: number;
  description?: string;
  isActive?: boolean;
}

export interface IMembershipRanksResponse {
  items: IMembershipRank[];
  totalCount: number;
  systemMessage: string | null;
}

export interface IMembershipRanksQuery {
  SearchTerm?: string;
  IsActive?: boolean;
  Page?: number;
  PageSize?: number;
}

export const getMembershipRanks = async (
  params?: IMembershipRanksQuery,
): Promise<IMembershipRanksResponse> => {
  const { data } = await AxiosClient.get<IMembershipRanksResponse>(
    "/api/MembershipRanks",
    { params },
  );
  return data;
};

export const createMembershipRank = async (
  rank: IMembershipRankRequest,
): Promise<IMembershipRank> => {
  const { data } = await AxiosClient.post<IMembershipRank>(
    "/api/MembershipRanks",
    rank,
  );
  return data;
};

export const updateMembershipRank = async (
  id: number,
  rank: IMembershipRankRequest,
): Promise<IMembershipRank> => {
  const { data } = await AxiosClient.put<IMembershipRank>(
    `/api/MembershipRanks/${id}`,
    rank,
  );
  return data;
};

export const updateMembershipRankStatus = async (
  id: number,
  isActive: boolean,
): Promise<IMembershipRank> => {
  const { data } = await AxiosClient.patch<IMembershipRank>(
    `/api/MembershipRanks/${id}/status`,
    { isActive },
  );
  return data;
};

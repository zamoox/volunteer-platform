import type { VolunteerRequest } from '../models/volunteer-request.model';

/** Відповідь мутації createRequest — вирівняна з полями CREATE_REQUEST. */
export interface CreateRequestMutationData {
  createRequest: VolunteerRequest;
}

/** Відповідь мутації completeRequestWithReview. */
export interface CompleteRequestWithReviewMutationData {
  completeRequestWithReview: VolunteerRequest;
}

export interface GetAllRequestsQueryData {
  getAllRequests: VolunteerRequest[];
}

export interface GetAllRequestsQueryVariables {
  category: string | null;
}

export interface GetMyRequestsQueryData {
  getMyRequests: VolunteerRequest[];
}

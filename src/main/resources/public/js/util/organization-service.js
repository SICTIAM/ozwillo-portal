import customFetch from "./custom-fetch";

export const fetchOrganizationComplete = async (organizationId) => {
  return await customFetch(`/my/api/organization/${organizationId}`);
};
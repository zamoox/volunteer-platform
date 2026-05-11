import { gql } from "apollo-angular";

export const GET_ALL_REQUESTS = gql`
  query ExampleQuery($category: String) {
    getAllRequests(category: $category) {
      id
      title
      description
      category
      status
      createdAt
      organization {
        id
        name
        description
        userId
      }
      volunteer {
        id
        firstName
        lastName
      }
      location {
        lat
        lng
        address
      }
    }
  }
`;

export const GET_MY_REQUESTS = gql`
  query GetMyRequests {
    getMyRequests {
      id
      title
      description
      category
      status
      createdAt
      organization {
        id
        name
        description
        userId
      }
      volunteer {
        id
        firstName
        lastName
      }
      location {
        lat
        lng
        address
      }
    }
  }
`;
import { jwtDecode, type JwtPayload } from "jwt-decode";

const isJwtTokenValid = (token: string): boolean => {
  if (!token) return false;

  try {
    const decodedToken = jwtDecode<JwtPayload>(token || "") || null;
    const currentTime = Date.now() / 1000; // Current time in seconds

    // Check if the token has expired or if exp is undefined
    if (!decodedToken.exp || decodedToken.exp < currentTime) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Invalid JWT token:", error);
    return false;
  }
};

export default isJwtTokenValid;

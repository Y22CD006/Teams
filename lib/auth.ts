import { cookies } from "next/headers";

export const auth = async () => {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("mock_userId");
  return {
    userId: userIdCookie ? userIdCookie.value : "cmrbl8igt0002hkb01jqnjbge", 
  };
};

export const getAuthUserId = async () => {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("mock_userId");
  return userIdCookie ? userIdCookie.value : "cmrbl8igt0002hkb01jqnjbge";
};

import { useLocalSearchParams, useRouter } from "expo-router";
import UserRideHistoryScreen from "./userRideHistory";

export default function RideHistoryPage() {
  const params = useLocalSearchParams();
  const user = JSON.parse(params.user as string);

  return <UserRideHistoryScreen user={user} />;
}

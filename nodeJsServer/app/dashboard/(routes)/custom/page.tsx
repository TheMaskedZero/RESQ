import type { Metadata } from "next";
import { ChartDisplay } from "@/components/chart-display";
import { ChartHistory } from "@/components/chart-history";
import { Chatbot } from "@/components/chatbot";
import { Cmd } from "@/components/cmd";
import { WebSocketProvider } from '@/components/contexts/WebSocketContext';
import { getSession } from "@/lib/auth/getSession";

import { CustomDashboard } from "@/components/customDashboard"

export const metadata: Metadata = {
    title: "Custom - Custom Dashboard",
    description: "Custom RESQ Custom dashboard",
};

export default async function ChatPage() {
    const session = await getSession();
    return (
        <WebSocketProvider>
            <div className="w-full flex-grow flex justify-center gap-[30px] px-[20px] py-[50px] overflow-x-clip">
                <div className="flex flex-col items-center gap-[10px]">
                    <CustomDashboard />
                </div>
            </div>
        </WebSocketProvider>
    );
}

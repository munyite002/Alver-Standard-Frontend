/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DashboardNav } from "@/components/Dashboard/dashboard-nav";
import { UserNav } from "@/components/User/user-nav";

export function DashboardHeader({
    searchQuery,
    setSearchQuery
}: {
    searchQuery?: string;
    setSearchQuery?: (value: string) => void;
}) {
    console.log("Search Query: ", searchQuery);
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="pr-0">
                    <DashboardNav />
                </SheetContent>
            </Sheet>
            <div className="hidden md:block">
                <h1 className="text-xl font-semibold">Payments Dashboard</h1>
            </div>
            <div className="flex-1 md:grow-0 md:w-[300px]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search transactions..."
                        className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
                        value={searchQuery}
                        onChange={(e) => {
                            //@ts-ignore
                            setSearchQuery(e.target.value);
                        }}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
                {/* <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        3
                    </span>
                    <span className="sr-only">Notifications</span>
                </Button> */}
                <UserNav />
            </div>
        </header>
    );
}

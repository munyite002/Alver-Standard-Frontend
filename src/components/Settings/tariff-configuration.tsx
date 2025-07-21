/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    getTariffs,
    createTariff,
    updateTariff,
    type Tariff
} from "@/../api/tariffs.api";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";

export function TariffConfiguration() {
    const axiosInstance = useAxiosWithAuth(
        import.meta.env.VITE_PUBLIC_STAGING_API
    );
    const [isSaving, setIsSaving] = useState(false);
    const [tariffs, setTariffs] = useState<Tariff[]>([]);
    const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);

    const [newTariffData, setNewTariffData] = useState<{
        name: string;
        provider: "KPLC" | "ALVER_POWER";
        ratePerUnit: number;
    }>({
        name: "",
        provider: "KPLC",
        ratePerUnit: 0
    });

    useEffect(() => {
        fetchTariffs();
    }, []);

    const fetchTariffs = async () => {
        try {
            setIsLoadingTariffs(true);
            const response = await getTariffs(axiosInstance);
            setTariffs(response.data);
        } catch (err) {
            console.error("Error fetching tariffs:", err);
            toast.error("Failed to fetch tariffs");
        } finally {
            setIsLoadingTariffs(false);
        }
    };

    const handleCreateTariff = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await createTariff(axiosInstance, newTariffData);
            toast.success("Tariff created successfully");
            setNewTariffData({
                name: "",
                provider: "KPLC",
                ratePerUnit: 0
            });
            fetchTariffs();
        } catch (err) {
            console.error("Error creating tariff:", err);
            toast.error(
                //@ts-ignore
                `Error creating tariff: ${err?.response?.data?.error}`
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateTariff = async (tarrif: any, ratePerUnit: number) => {
        try {
            setIsSaving(true);
            await updateTariff(axiosInstance, tarrif.id, {
                ...tarrif,
                ratePerUnit
            });
            toast.success("Tariff updated successfully");
            fetchTariffs();
        } catch (err) {
            console.error("Error updating tariff:", err);
            toast.error(
                //@ts-ignore
                `Error updating tariff: ${err?.response?.data?.error}`
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Price Tariff Configuration</CardTitle>
                <CardDescription>
                    Manage and update your current pricing structure.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current Tariffs Display */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Current Tariffs</h3>
                    <Separator />
                    {isLoadingTariffs ? (
                        <p>Loading tariffs...</p>
                    ) : tariffs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 pt-2">
                            {tariffs.map((tariff) => (
                                <div
                                    key={tariff.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div>
                                        <h4 className="font-medium">
                                            {tariff.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Provider: {tariff.provider}
                                        </p>
                                        <p className="text-lg font-semibold">
                                            Ksh {tariff.ratePerUnit}/kWh
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            defaultValue={tariff.ratePerUnit}
                                            onChange={(e) =>
                                                setTariffs((prev) =>
                                                    prev.map((t) =>
                                                        t.id === tariff.id
                                                            ? {
                                                                  ...t,
                                                                  ratePerUnit:
                                                                      parseFloat(
                                                                          e
                                                                              .target
                                                                              .value
                                                                      )
                                                              }
                                                            : t
                                                    )
                                                )
                                            }
                                            className="w-32"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleUpdateTariff(
                                                    tariff,
                                                    tariff.ratePerUnit
                                                )
                                            }
                                            disabled={isSaving}
                                        >
                                            Update
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            No tariffs configured yet.
                        </p>
                    )}
                </div>
                {/* Tariff Creation Form */}
                {(() => {
                    const hasKPLC = tariffs.some(
                        (t) => t.name.includes("KPLC")
                    );
                    const hasAlver = tariffs.some((t) =>
                        t.name.includes("ALVER")
                    );

                    // Show form only if both are NOT present
                    if (!(hasKPLC && hasAlver)) {
                        return (
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">
                                    Create New Tariff
                                </h3>
                                <Separator />
                                <form
                                    onSubmit={handleCreateTariff}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="tariff-name">
                                                Tariff Name
                                            </Label>
                                            <Input
                                                id="tariff-name"
                                                placeholder="e.g., Standard Plan"
                                                value={newTariffData.name}
                                                onChange={(e) =>
                                                    setNewTariffData(
                                                        (prev) => ({
                                                            ...prev,
                                                            name: e.target.value
                                                        })
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="provider">
                                                Provider
                                            </Label>
                                            <select
                                                id="provider"
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                                value={newTariffData.provider}
                                                onChange={(e) =>
                                                    setNewTariffData(
                                                        (prev) => ({
                                                            ...prev,
                                                            provider: e.target
                                                                .value as
                                                                | "KPLC"
                                                                | "ALVER_POWER"
                                                        })
                                                    )
                                                }
                                                required
                                            >
                                                <option value="KPLC">
                                                    KPLC
                                                </option>
                                                <option value="ALVER_POWER">
                                                    ALVER POWER
                                                </option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rate-per-unit">
                                                Rate per Unit (Ksh/kWh)
                                            </Label>
                                            <Input
                                                id="rate-per-unit"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    newTariffData.ratePerUnit
                                                }
                                                onChange={(e) =>
                                                    setNewTariffData(
                                                        (prev) => ({
                                                            ...prev,
                                                            ratePerUnit:
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                )
                                                        })
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                        >
                                            {isSaving
                                                ? "Creating..."
                                                : "Create Tariff"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        );
                    }
                    return null;
                })()}
            </CardContent>
        </Card>
    );
}

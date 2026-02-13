// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// //@ts-nocheck
import React, { useEffect, useState } from 'react';
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { getAllMeters, createMeter, updateMeter, deleteMeter, generateMeterCredit, generateTamperCode } from '../api/meters.api';
import type { Meter } from '../../api/meters.api';
import { getAccounts } from '../../api/accounts.api';
import type { Account } from '../../api/accounts.api';
import { getTariffs } from '../../api/tariffs.api'
import { toast, Toaster } from 'sonner';
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
import { Plus, Search, ChevronRight, ChevronLeft, LoaderIcon, Pencil, Trash2, Eye, X, MoreHorizontal } from "lucide-react";


const Meters: React.FC = () => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API)
  const [metersData, setMetersData] = useState<any>({
    meters: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortField: "createdAt",
    sortOrder: "desc",
    meterNumber: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(false);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [formData, setFormData] = useState({
    meterNumber: '',
    location: '',
    openingDeficit: 0,
    make: '',
    tariffId: '',
    email: '',
    SGC: '',
    TI: '',
    KRN: '',
    accountId: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  const fetchMeters = async () => {
    try {
      setIsLoading(true);
      const data = await getAllMeters(axiosInstance, filters);
      setMetersData(data);
    } catch (error) {
      console.error('Error fetching meters:', error);
      toast.error('Failed to fetch meters');
    } finally {
      setIsLoading(false);
    }
  };

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

  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await getAccounts(axiosInstance);
      setAccounts(response.data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, [filters]);

  useEffect(() => {
    fetchTariffs();
    fetchAccounts();
  }, []);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (newPage: number) => {
    handleFilterChange({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    handleFilterChange({ limit: newLimit, page: 1 });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange({ meterNumber: value, page: 1 });
    handleFilterChange({ page: 1 });
  };

  const handleSortChange = (field: string) => {
    const isAsc = filters.sortField === field && filters.sortOrder === 'asc';
    handleFilterChange({
      sortField: field,
      sortOrder: isAsc ? 'desc' : 'asc',
      page: 1
    });
  };

  const handleOpen = (meter?: Meter) => {
    if (meter) {
      setEditingMeter(meter);
      setFormData({
        meterNumber: meter.meterNumber,
        location: meter.location,
        openingDeficit: meter.openingDeficit,
        tariffId: meter.tariffId || '',
        email: meter.email || '',
        SGC: meter.SGC || '',
        TI: meter.TI || '',
        KRN: meter.KRN || '',
        make: meter.make || '',
        accountId: meter.accountId || '',
      });
    } else {
      setEditingMeter(null);
      setFormData({
        meterNumber: '',
        location: '',
        openingDeficit: 0,
        tariffId: '',
        email: '',
        SGC: '',
        TI: '',
        KRN: '',
        make: '',
        accountId: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMeter(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingMeter) {
        await updateMeter(axiosInstance, editingMeter.id, formData);
        toast.success('Meter updated successfully');
      } else {
        await createMeter(axiosInstance, formData);
        toast.success('Meter created successfully');
      }
      handleClose();
      fetchMeters();
    } catch (error) {
      console.error('Error saving meter:', error);
      //@ts-ignore
      toast.error(`Error saving meter: ${error?.response?.data?.error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this meter?')) {
      try {
        await deleteMeter(axiosInstance, id);
        fetchMeters();
      } catch (error) {
        console.error('Error deleting meter:', error);
      }
    }
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [tamperCode, setTamperCode] = useState<string | null>(null);
  const [creditCode, setCreditCode] = useState<string | null>(null);
  const [isTamperLoading, setIsTamperLoading] = useState(false);
  const [isCreditLoading, setIsCreditLoading] = useState(false);

  const currentMeters = metersData.meters.filter((meter: Meter) => {
    const query = searchQuery.toLowerCase();
    return (
      meter.meterNumber.toLowerCase().includes(query) ||
      meter.location.toLowerCase().includes(query)
    );
  });
  const pagination = metersData.pagination;

  const activeMeter = selectedMeter || currentMeters[0];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meters</h1>
        {user?.role == "admin" && (
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Meter
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meter number"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchQuery && (
                <X
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground cursor-pointer"
                  onClick={() => handleSearchChange('')}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100">
              <TableHead
                className="py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSortChange('meterNumber')}
              >
                <div className="flex items-center gap-1">
                  Meter Number
                  {filters.sortField === 'meterNumber' && (
                    <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Location</TableHead>
              <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Account</TableHead>
              <TableHead
                className="py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSortChange('openingDeficit')}
              >
                <div className="flex items-center gap-1">
                  Deficit (Ksh)
                  {filters.sortField === 'openingDeficit' && (
                    <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSortChange('totalAmount')}
              >
                <div className="flex items-center gap-1">
                  Total Amount (Ksh)
                  {filters.sortField === 'totalAmount' && (
                    <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSortChange('totalUnits')}
              >
                <div className="flex items-center gap-1">
                  Total Units
                  {filters.sortField === 'totalUnits' && (
                    <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              {user?.role == "admin" && (
                <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={user?.role == "admin" ? 7: 6} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center">
                    <LoaderIcon className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                    <p className="text-gray-500 text-sm">Loading meters...</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {currentMeters.length > 0 ? (
                currentMeters.map((meter, index) => (
                  <TableRow
                    key={meter.id}
                    className={`border-b border-gray-50 hover:bg-gray-25 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        <span className="font-medium text-gray-900">{meter.meterNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-gray-700">{meter.location}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-gray-700">
                        {accounts.find(a => a.id === meter.accountId)?.name || 'No Account'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${meter.openingDeficit > 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {new Intl.NumberFormat('en-KE', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 0,
                        }).format(meter.openingDeficit)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-gray-900 font-medium">
                        {new Intl.NumberFormat('en-KE', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 0,
                        }).format(meter.totalAmount || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-gray-700 font-medium">
                        {meter.totalUnits ? meter.totalUnits.toFixed(2) : '0.00'}
                      </span>
                    </TableCell>
                    {user?.role == "admin" && (
                      <TableCell className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpen(meter)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Meter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => (
                                setActionDialogOpen(true),
                                setSelectedMeter(meter)
                              )}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Actions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(meter.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Meter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No meters found</h3>
                      <p className="text-gray-500 text-sm">No meters found matching your criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total} entries
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              className="h-8 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none"
              value={filters.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map(limit => (
                <option key={limit} value={limit}>{limit}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={!pagination.hasPrevPage || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={!pagination.hasNextPage || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='bg-white max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingMeter ? 'Edit Meter' : 'Add New Meter'}</DialogTitle>
            <DialogDescription>
              {editingMeter ? 'Update the meter details below.' : 'Fill in the meter details below.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="meterNumber">Meter Number</label>
                <Input
                  id="meterNumber"
                  value={formData.meterNumber}
                  onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="location">Location</label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="openingDeficit">Opening Deficit</label>
                <Input
                  id="openingDeficit"
                  type="number"
                  value={formData.openingDeficit}
                  onChange={(e) => setFormData({ ...formData, openingDeficit: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="make">Make</label>
                <select
                  id="make"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.make || ''}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                >
                  <option value="">Select Make</option>
                  <option value="STRON">STRON</option>
                  <option value="HES">HES</option>
                </select>
              </div>

              {formData.make === 'HES' && (
                <>
                  <div className="grid gap-2">
                    <label htmlFor="sgc">SGC</label>
                    <Input
                      id="sgc"
                      value={formData.SGC}
                      onChange={(e) => setFormData({ ...formData, SGC: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="ti">TI</label>
                    <Input
                      id="ti"
                      value={formData.TI}
                      onChange={(e) => setFormData({ ...formData, TI: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="krn">KRN</label>
                    <Input
                      id="krn"
                      value={formData.KRN}
                      onChange={(e) => setFormData({ ...formData, KRN: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <label htmlFor="tariff">Tariff</label>
                <select
                  id="tariff"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.tariffId || ''}
                  onChange={(e) => setFormData({ ...formData, tariffId: e.target.value })}
                >
                  <option value="">Select Tariff</option>
                  {tariffs.map(tariff => (
                    <option key={tariff.id} value={tariff.id}>{tariff.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="account">Account</label>
                <select
                  id="account"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.accountId || ''}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                >
                  <option value="">Select Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="email">Email (Optional)</label>
                <Input
                  id="email"
                  type="text"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingMeter ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ACTION DIALOG */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meter Actions</DialogTitle>
            <DialogDescription>
              View meter details and perform actions.
            </DialogDescription>
          </DialogHeader>
          {/* Find the selected meter */}
          {(() => {

            // These would be replaced with your actual API calls
            const generateClearTamperCode = async (meterNumber: string) => {
              setIsTamperLoading(true);
              setTamperCode(null);
              try {
                const response = await generateTamperCode(axiosInstance, {
                  meterNumber
                });
                if (response && response.token) {
                  setTamperCode(response.token == "N/A" ? response.rawResponse : response.token);
                  toast.success("Clear tamper code generated successfully");
                } else {
                  toast.error("Failed to generate clear tamper code");
                }
              } catch (err) {
                console.log("Failed To Generate Clear Tamper Code:", err);
                toast.error("Failed to generate clear tamper code");
              } finally {
                setIsTamperLoading(false);
              }
            };

            const generateCredit = async (meterId: string, meterNumber: string, amount: number) => {
              setIsCreditLoading(true);
              setCreditCode(null);

              try {
                const response = await generateMeterCredit(axiosInstance, {
                  meterId,
                  meterNumber,
                  amount,
                });
                // Ensure the response exists and has a token
                if (response && response.token) {
                  setCreditCode(response.token);
                  toast.success("Credit generated successfully");
                } else {
                  toast.error("Failed to generate credit code");
                }
              } catch (err) {
                console.error("Error generating credit:", err);
                toast.error("Failed to generate credit code");
              } finally {
                setIsCreditLoading(false);
              }
            };


            if (!activeMeter) {
              return <div className="text-gray-500">No meter selected.</div>;
            }
            // Determine token type and value
            let tokenType = null;
            let tokenValue = null;
            if (tamperCode) {
              tokenType = "tamper";
              tokenValue = tamperCode;
            } else if (creditCode) {
              tokenType = "credit";
              tokenValue = creditCode;
            }
            return (
              <div className="space-y-4">
                <div>
                  <div className="font-semibold">Meter Number:</div>
                  <div>{selectedMeter?.meterNumber}</div>
                </div>
                <div>
                  <div className="font-semibold">Location:</div>
                  <div>{selectedMeter?.location}</div>
                </div>
                <div>
                  <div className="font-semibold">Deficit (Ksh):</div>
                  <div>
                    {new Intl.NumberFormat('en-KE', {
                      style: 'currency',
                      currency: 'KES',
                      minimumFractionDigits: 0,
                    }).format(selectedMeter?.openingDeficit ?? 0)}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="secondary"
                    disabled={isTamperLoading}
                    onClick={() => selectedMeter?.meterNumber && generateClearTamperCode(selectedMeter.meterNumber)}
                  >
                    {isTamperLoading ? "Generating..." : "Clear Tamper"}
                  </Button>
                  {tamperCode && (
                    <div className="bg-gray-100 rounded p-2 text-center font-mono text-lg tracking-widest">
                      <span className="font-semibold">Tamper Code:</span> <br />
                      <span>{tamperCode}</span>
                    </div>
                  )}
                  <form
                    className="flex flex-col gap-2"
                    onSubmit={async e => {
                      e.preventDefault();
                      // @ts-ignore
                      const amount = Number(e.target.amount.value);
                      await generateCredit(selectedMeter?.id ?? '', selectedMeter?.meterNumber, amount);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        name="amount"
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Amount (Ksh)"
                        required
                        className="w-32"
                      />
                      <Button type="submit" variant="default" disabled={isCreditLoading}>
                        {isCreditLoading ? "Generating..." : "Generate Credit"}
                      </Button>
                    </div>
                  </form>
                  {creditCode && (
                    <div className="bg-gray-100 rounded p-2 text-center font-mono text-lg tracking-widest">
                      <span className="font-semibold">Credit Code:</span> <br />
                      <span>{creditCode}</span>
                    </div>
                  )}
                  {/* Send SMS Button and details */}
                  {tokenType && tokenValue && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="text-xs text-gray-600">Meter ID: <span className="font-mono">{selectedMeter?.meterNumber}</span></div>
                      <div className="text-xs text-gray-600">Token: <span className="font-mono">{tokenValue}</span></div>
                      <div className="text-xs text-gray-600">Token Type: <span className="font-mono">{tokenType}</span></div>
                      {/* <Button
                        variant="default"
                        onClick={() => {
                          // Placeholder for SMS API integration
                          toast.info(`Send SMS: Meter ID: ${selectedMeter?.id}, Token: ${tokenValue}, Type: ${tokenType}`);
                        }}
                      >
                        Send SMS
                      </Button> */}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position='top-right' richColors />
    </div >
  );
};

export default Meters;

/* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useState } from "react";
// import { useOutletContext } from "react-router-dom";
// import {
//   Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal,
//   Pencil, Trash2, Eye, X, Zap, MapPin, Building2,
//   AlertCircle, CheckCircle2, Gauge, ArrowUpDown,
//   ChevronDown, Loader2, CreditCard, ShieldAlert,
//   Copy, Check, Calendar, SlidersHorizontal, RefreshCw
// } from "lucide-react";
// import { toast, Toaster } from "sonner";
// import useAxiosWithAuth from "@/../utils/axiosInterceptor";
// import {
//   getAllMeters,
//   createMeter,
//   updateMeter,
//   deleteMeter,
//   generateMeterCredit,
//   generateTamperCode
// } from "../api/meters.api";
// import type { Meter } from "../api/meters.api";
// import { getAccounts } from "../../api/accounts.api";
// import type { Account } from "../../api/accounts.api";
// import { getTariffs } from "../../api/tariffs.api";

// // ─── Helpers ─────────────────────────────────────────────────────────────────
// const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);
// const fmtNum = (n: number) => new Intl.NumberFormat("en-KE").format(n);

// const getMonthDates = () => {
//   const now = new Date();
//   const start = new Date(now.getFullYear(), now.getMonth(), 1);
//   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
//   const formatDate = (date: Date) => date.toISOString().split('T')[0];
//   return {
//     startDate: formatDate(start),
//     endDate: formatDate(end)
//   };
// };

// const EMPTY_FORM = { meterNumber: "", location: "", openingDeficit: 0, make: "", tariffId: "", email: "", SGC: "", TI: "", KRN: "", accountId: "" };

// // ─── Reusable: Form Field ─────────────────────────────────────────────────────
// function Field({ label, required, children, hint }: any) {
//   return (
//     <div className="flex flex-col gap-1.5">
//       <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//         {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
//       </label>
//       {children}
//       {hint && <p className="text-xs text-gray-400">{hint}</p>}
//     </div>
//   );
// }

// function TextInput({ value, onChange, placeholder = "", type = "text", required, ...rest }: any) {
//   return (
//     <input
//       type={type}
//       value={value || ""}
//       onChange={onChange}
//       placeholder={placeholder}
//       required={required}
//       className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
//       {...rest}
//     />
//   );
// }

// function SelectInput({ value, onChange, children }: any) {
//   return (
//     <div className="relative">
//       <select
//         value={value || ""}
//         onChange={onChange}
//         className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none pr-8"
//       >
//         {children}
//       </select>
//       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
//     </div>
//   );
// }

// // ─── Meter Form Dialog ────────────────────────────────────────────────────────
// function MeterFormDialog({ open, onClose, editing, tariffs, accounts, onSubmit, isSaving }: any) {
//   const [form, setForm] = useState<any>(EMPTY_FORM);
//   const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

//   useEffect(() => {
//     if (editing) {
//       setForm({
//         meterNumber: editing.meterNumber || "",
//         location: editing.location || "",
//         openingDeficit: editing.openingDeficit || 0,
//         make: editing.make || "",
//         tariffId: editing.tariffId || "",
//         email: editing.email || "",
//         SGC: editing.SGC || "",
//         TI: editing.TI || "",
//         KRN: editing.KRN || "",
//         accountId: editing.accountId || "",
//       });
//     } else {
//       setForm(EMPTY_FORM);
//     }
//   }, [editing, open]);

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
//       <div
//         className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
//               <Gauge className="w-4 h-4 text-white" />
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-900 text-sm leading-tight">
//                 {editing ? "Edit Meter" : "Add New Meter"}
//               </h3>
//               <p className="text-xs text-gray-400">
//                 {editing ? `Editing ${editing.meterNumber}` : "Fill in the details below"}
//               </p>
//             </div>
//           </div>
//           <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
//             <X className="w-3.5 h-3.5 text-gray-500" />
//           </button>
//         </div>

//         {/* Scrollable Body */}
//         <div className="overflow-y-auto flex-1 px-6 py-5">
//           <form id="meter-form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-5">

//             {/* Core Details */}
//             <div>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Core Details</p>
//               <div className="grid grid-cols-2 gap-4">
//                 <Field label="Meter Number" required>
//                   <TextInput value={form.meterNumber} onChange={(e: any) => set("meterNumber", e.target.value)} placeholder="e.g. KPL-001-A" required />
//                 </Field>
//                 <Field label="Opening Deficit (KES)" required>
//                   <TextInput type="number" value={form.openingDeficit} onChange={(e: any) => set("openingDeficit", parseFloat(e.target.value))} placeholder="0" required />
//                 </Field>
//               </div>
//               <div className="mt-4">
//                 <Field label="Location" required>
//                   <TextInput value={form.location} onChange={(e: any) => set("location", e.target.value)} placeholder="e.g. Westlands, Block A" required />
//                 </Field>
//               </div>
//             </div>

//             <div className="border-t border-gray-100" />

//             {/* Assignment */}
//             <div>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Assignment</p>
//               <div className="grid grid-cols-2 gap-4">
//                 <Field label="Tariff">
//                   <SelectInput value={form.tariffId} onChange={(e: any) => set("tariffId", e.target.value)}>
//                     <option value="">No tariff</option>
//                     {tariffs.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
//                   </SelectInput>
//                 </Field>
//                 <Field label="Account">
//                   <SelectInput value={form.accountId} onChange={(e: any) => set("accountId", e.target.value)}>
//                     <option value="">No account</option>
//                     {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
//                   </SelectInput>
//                 </Field>
//               </div>
//               <div className="mt-4">
//                 <Field label="Email" hint="Optional — for token delivery notifications">
//                   <TextInput type="text" value={form.email} onChange={(e: any) => set("email", e.target.value)} placeholder="user@example.com" />
//                 </Field>
//               </div>
//             </div>

//             <div className="border-t border-gray-100" />

//             {/* Hardware */}
//             <div>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Hardware</p>
//               <Field label="Meter Make" required>
//                 <SelectInput value={form.make} onChange={(e: any) => set("make", e.target.value)}>
//                   <option value="">Select make…</option>
//                   <option value="STRON">STRON</option>
//                   <option value="HES">HES</option>
//                 </SelectInput>
//               </Field>

//               {form.make === "HES" && (
//                 <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
//                   <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1.5">
//                     <Zap className="w-3 h-3" />
//                     HES Configuration
//                   </p>
//                   <div className="grid grid-cols-3 gap-3">
//                     <Field label="SGC">
//                       <TextInput value={form.SGC} onChange={(e: any) => set("SGC", e.target.value)} placeholder="123456" />
//                     </Field>
//                     <Field label="TI">
//                       <TextInput value={form.TI} onChange={(e: any) => set("TI", e.target.value)} placeholder="78" />
//                     </Field>
//                     <Field label="KRN">
//                       <TextInput value={form.KRN} onChange={(e: any) => set("KRN", e.target.value)} placeholder="2" />
//                     </Field>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </form>
//         </div>

//         {/* Footer */}
//         <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 flex-shrink-0 bg-gray-50/60">
//           <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
//             Cancel
//           </button>
//           <button
//             type="submit"
//             form="meter-form"
//             disabled={isSaving}
//             className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200"
//           >
//             {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
//             {isSaving ? "Saving…" : editing ? "Save Changes" : "Create Meter"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Token Display ────────────────────────────────────────────────────────────
// function TokenDisplay({ label, code, color = "gray" }: any) {
//   const [copied, setCopied] = useState(false);
//   const colors: any = {
//     blue: "bg-blue-50 border-blue-200 text-blue-900",
//     green: "bg-emerald-50 border-emerald-200 text-emerald-900",
//     gray: "bg-gray-100 border-gray-200 text-gray-800",
//   };
//   const copy = () => {
//     navigator.clipboard.writeText(code);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };
//   return (
//     <div className={`rounded-xl border p-4 ${colors[color]}`}>
//       <div className="flex items-center justify-between mb-2">
//         <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</p>
//         <button onClick={copy} className="flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity">
//           {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
//           {copied ? "Copied" : "Copy"}
//         </button>
//       </div>
//       <p className="font-mono-custom text-lg font-semibold tracking-[0.15em] break-all">{code}</p>
//     </div>
//   );
// }

// // ─── Meter Actions Dialog ─────────────────────────────────────────────────────
// function MeterActionsDialog({ open, onClose, meter, axiosInstance }: any) {
//   const [tamperLoading, setTamperLoading] = useState(false);
//   const [creditLoading, setCreditLoading] = useState(false);
//   const [tamperCode, setTamperCode] = useState<string | null>(null);
//   const [creditCode, setCreditCode] = useState<string | null>(null);
//   const [creditAmount, setCreditAmount] = useState("");

//   useEffect(() => {
//     if (!open) {
//       setTamperCode(null);
//       setCreditCode(null);
//       setCreditAmount("");
//     }
//   }, [open]);

//   if (!open || !meter) return null;

//   const handleTamper = async () => {
//     setTamperLoading(true);
//     setTamperCode(null);
//     try {
//       const response = await generateTamperCode(axiosInstance, {
//         meterNumber: meter.meterNumber
//       });
//       if (response && response.token) {
//         setTamperCode(response.token === "N/A" ? response.rawResponse : response.token);
//         toast.success("Clear tamper code generated successfully");
//       } else {
//         toast.error("Failed to generate clear tamper code");
//       }
//     } catch (err) {
//       console.error("Failed To Generate Clear Tamper Code:", err);
//       toast.error("Failed to generate clear tamper code");
//     } finally {
//       setTamperLoading(false);
//     }
//   };

//   const handleCredit = async (e: any) => {
//     e.preventDefault();
//     setCreditLoading(true);
//     setCreditCode(null);
//     try {
//       const response = await generateMeterCredit(axiosInstance, {
//         meterId: meter.id,
//         meterNumber: meter.meterNumber,
//         amount: Number(creditAmount),
//       });
//       if (response && response.token) {
//         setCreditCode(response.token);
//         toast.success("Credit generated successfully");
//       } else {
//         toast.error("Failed to generate credit code");
//       }
//     } catch (err) {
//       console.error("Error generating credit:", err);
//       toast.error("Failed to generate credit code");
//     } finally {
//       setCreditLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
//       <div
//         className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md animate-in"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
//               <Gauge className="w-4 h-4 text-white" />
//             </div>
//             <div>
//               <h3 className="font-semibold text-gray-900 text-sm leading-tight">Meter Actions</h3>
//               <p className="font-mono-custom text-xs text-gray-400">{meter.meterNumber}</p>
//             </div>
//           </div>
//           <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
//             <X className="w-3.5 h-3.5 text-gray-500" />
//           </button>
//         </div>

//         {/* Meter Info Strip */}
//         <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
//           <div className="grid grid-cols-3 gap-4 text-xs">
//             <div>
//               <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Location</p>
//               <p className="text-gray-700 font-medium">{meter.location}</p>
//             </div>
//             <div>
//               <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Make</p>
//               <p className="text-gray-700 font-medium">{meter.make || "—"}</p>
//             </div>
//             <div>
//               <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Deficit</p>
//               <p className={`font-semibold ${meter.openingDeficit > 0 ? "text-rose-600" : "text-emerald-600"}`}>
//                 {meter.openingDeficit > 0 ? fmt(meter.openingDeficit) : "None"}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Actions Body */}
//         <div className="p-6 space-y-5">

//           {/* Clear Tamper */}
//           <div>
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-2">
//                 <ShieldAlert className="w-4 h-4 text-amber-500" />
//                 <p className="text-sm font-semibold text-gray-800">Clear Tamper</p>
//               </div>
//               <button
//                 onClick={handleTamper}
//                 disabled={tamperLoading}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 {tamperLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
//                 {tamperLoading ? "Generating…" : "Generate Code"}
//               </button>
//             </div>
//             {tamperCode && <TokenDisplay label="Tamper Clear Code" code={tamperCode} color="gray" />}
//           </div>

//           <div className="border-t border-gray-100" />

//           {/* Generate Credit */}
//           <div>
//             <div className="flex items-center gap-2 mb-3">
//               <CreditCard className="w-4 h-4 text-blue-500" />
//               <p className="text-sm font-semibold text-gray-800">Generate Credit</p>
//             </div>
//             <form onSubmit={handleCredit} className="flex items-center gap-2">
//               <div className="relative flex-1">
//                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">KES</span>
//                 <input
//                   type="number"
//                   min={1}
//                   step={1}
//                   value={creditAmount}
//                   onChange={(e) => setCreditAmount(e.target.value)}
//                   placeholder="0"
//                   required
//                   className="w-full pl-11 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
//                 />
//               </div>
//               <button
//                 type="submit"
//                 disabled={creditLoading || !creditAmount}
//                 className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-200 whitespace-nowrap"
//               >
//                 {creditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
//                 {creditLoading ? "Generating…" : "Generate"}
//               </button>
//             </form>
//             {creditCode && (
//               <div className="mt-3">
//                 <TokenDisplay label="Credit Token" code={creditCode} color="green" />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/60">
//           <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Delete Confirm Dialog ────────────────────────────────────────────────────
// function DeleteDialog({ meter, onConfirm, onClose }: any) {
//   if (!meter) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
//       <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-sm animate-in" onClick={(e) => e.stopPropagation()}>
//         <div className="p-6">
//           <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
//             <Trash2 className="w-5 h-5 text-rose-600" />
//           </div>
//           <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Delete meter?</h3>
//           <p className="text-sm text-gray-500 text-center">
//             <span className="font-mono-custom font-medium text-gray-700">{meter.meterNumber}</span> will be permanently removed. This action cannot be undone.
//           </p>
//         </div>
//         <div className="px-6 pb-6 flex gap-2">
//           <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
//             Cancel
//           </button>
//           <button onClick={() => onConfirm(meter.id)} className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors">
//             Delete
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Row Action Menu ──────────────────────────────────────────────────────────
// function RowMenu({ meter, onEdit, onView, onDelete }: any) {
//   const [open, setOpen] = useState(false);
//   return (
//     <div className="relative">
//       <button
//         onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
//         className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
//       >
//         <MoreHorizontal className="w-4 h-4" />
//       </button>
//       {open && (
//         <>
//           <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
//           <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in">
//             <div className="p-1">
//               <button
//                 onClick={() => { setOpen(false); onEdit(meter); }}
//                 className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
//               >
//                 <Pencil className="w-3.5 h-3.5 text-gray-400" />
//                 Edit Meter
//               </button>
//               <button
//                 onClick={() => { setOpen(false); onView(meter); }}
//                 className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
//               >
//                 <Eye className="w-3.5 h-3.5 text-gray-400" />
//                 View Actions
//               </button>
//             </div>
//             <div className="border-t border-gray-100 p-1">
//               <button
//                 onClick={() => { setOpen(false); onDelete(meter); }}
//                 className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
//               >
//                 <Trash2 className="w-3.5 h-3.5" />
//                 Delete Meter
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────
// export function MetersPage() {
//   const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);
//   const user = JSON.parse(localStorage.getItem("user") || "{}");
//   const isAdmin = user?.role === "admin";

//   // State
//   const [metersData, setMetersData] = useState<any>({
//     meters: [],
//     pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false }
//   });
//   const [filters, setFilters] = useState<any>({
//     page: 1,
//     limit: 10,
//     sortField: "createdAt",
//     sortOrder: "desc",
//     ...getMonthDates()
//   });
//   const [filtersOpen, setFiltersOpen] = useState(false);
//   const { searchQuery, setSearchQuery } = useOutletContext<any>();
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [tariffs, setTariffs] = useState<any[]>([]);
//   const [accounts, setAccounts] = useState<Account[]>([]);

//   // Dialog state
//   const [formOpen, setFormOpen] = useState(false);
//   const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
//   const [actionsOpen, setActionsOpen] = useState(false);
//   const [actionsMeter, setActionsMeter] = useState<Meter | null>(null);
//   const [deleteMeter, setDeleteMeter] = useState<Meter | null>(null);

//   // Fetching
//   const fetchMeters = async () => {
//     try {
//       setIsLoading(true);
//       const data = await getAllMeters(axiosInstance, filters);
//       setMetersData({
//         meters: data.meters || [],
//         pagination: data.pagination || metersData.pagination
//       });
//     } catch (error) {
//       console.error('Error fetching meters:', error);
//       toast.error('Failed to fetch meters');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchTariffs = async () => {
//     try {
//       const response = await getTariffs(axiosInstance);
//       setTariffs(response.data);
//     } catch (err) {
//       console.error("Error fetching tariffs:", err);
//     }
//   };

//   const fetchAccounts = async () => {
//     try {
//       const response = await getAccounts(axiosInstance);
//       setAccounts(response.data);
//     } catch (err) {
//       console.error("Error fetching accounts:", err);
//     }
//   };

//   useEffect(() => {
//     fetchMeters();
//   }, [filters]);

//   useEffect(() => {
//     fetchTariffs();
//     fetchAccounts();
//   }, []);

//   const handleSort = (field: string) => {
//     const isAsc = filters.sortField === field && filters.sortOrder === 'asc';
//     setFilters((prev: any) => ({
//       ...prev,
//       sortField: field,
//       sortOrder: isAsc ? 'desc' : 'asc',
//       page: 1
//     }));
//   };

//   const handlePageChange = (newPage: number) => {
//     if (newPage < 1 || newPage > metersData.pagination.totalPages) return;
//     setFilters((prev: any) => ({ ...prev, page: newPage }));
//   };

//   const handleLimitChange = (newLimit: number) => {
//     setFilters((prev: any) => ({ ...prev, limit: newLimit, page: 1 }));
//   };



//   const handleSubmit = async (form: any) => {
//     setIsSaving(true);
//     try {
//       if (editingMeter) {
//         await updateMeter(axiosInstance, editingMeter.id, form);
//         toast.success('Meter updated successfully');
//       } else {
//         await createMeter(axiosInstance, form);
//         toast.success('Meter created successfully');
//       }
//       setFormOpen(false);
//       setEditingMeter(null);
//       fetchMeters();
//     } catch (error: any) {
//       console.error('Error saving meter:', error);
//       toast.error(`Error saving meter: ${error?.response?.data?.error || "Unknown error"}`);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleConfirmDelete = async (id: string) => {
//     try {
//       await deleteMeter(axiosInstance, id);
//       toast.success("Meter deleted successfully");
//       setDeleteMeter(null);
//       fetchMeters();
//     } catch (error) {
//       console.error('Error deleting meter:', error);
//       toast.error("Failed to delete meter");
//     }
//   };

//   // Derived
//   const filteredMeters = metersData.meters.filter((m: Meter) => {
//     const q = searchQuery.toLowerCase();
//     return !q || m.meterNumber.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
//   });

//   const SortIcon = ({ field }: { field: string }) => {
//     if (filters.sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
//     return filters.sortOrder === "asc"
//       ? <ChevronDown className="w-3 h-3 text-blue-500 rotate-180" />
//       : <ChevronDown className="w-3 h-3 text-blue-500" />;
//   };

//   return (
//     <div className="min-h-screen bg-gray-50/60 font-sans">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
//         * { font-family: 'DM Sans', sans-serif; }
//         .font-mono-custom { font-family: 'DM Mono', monospace; }
//         @keyframes fadeInUp {
//           from { opacity: 0; transform: translateY(8px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//         .animate-in { animation: fadeInUp 0.3s ease both; }
//         @keyframes shimmer { to { background-position: -200% 0; } }
//         .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
//       `}</style>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

//         {/* ── Page Header ── */}
//         <div className="flex items-start justify-between animate-in">
//           <div>
//             <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Infrastructure</p>
//             <h1 className="text-2xl font-bold text-gray-900 leading-tight">Meters</h1>
//             <p className="text-sm text-gray-400 mt-0.5">{fmtNum(metersData.pagination.total)} total meters registered</p>
//           </div>
//           {isAdmin && (
//             <button
//               onClick={() => { setEditingMeter(null); setFormOpen(true); }}
//               className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
//             >
//               <Plus className="w-4 h-4" />
//               Add Meter
//             </button>
//           )}
//         </div>

//         {/* ── Table Card ── */}
//         <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in" style={{ animationDelay: "80ms" }}>

//           {/* Toolbar */}
//           <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
//             <div className="flex items-center gap-3">
//               <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
//                 <Gauge className="w-3.5 h-3.5 text-slate-500" />
//               </div>
//               <h2 className="text-sm font-semibold text-gray-900">Meter Registry</h2>
//               <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
//                 {fmtNum(filteredMeters.length)} {filteredMeters.length !== metersData.meters.length ? "filtered" : "total"}
//               </span>
//             </div>

//             <div className="flex items-center gap-2">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   placeholder="Search meter or location…"
//                   className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
//                 />
//                 {searchQuery && (
//                   <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
//                     <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
//                   </button>
//                 )}
//               </div>
//               <button
//                 onClick={() => setFiltersOpen(!filtersOpen)}
//                 className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${filtersOpen
//                   ? "bg-blue-50 border-blue-200 text-blue-600"
//                   : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
//                   }`}
//               >
//                 <SlidersHorizontal className="w-3.5 h-3.5" />
//                 Filters
//                 {(filters.startDate || filters.endDate) && (
//                   <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
//                 )}
//               </button>
//               <button
//                 onClick={fetchMeters}
//                 className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
//                 title="Refresh data"
//               >
//                 <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
//               </button>
//             </div>
//           </div>

//           {/* Collapsible Filters */}
//           {filtersOpen && (
//             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex flex-wrap items-end gap-4 animate-in">
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Start Date</label>
//                 <div className="relative">
//                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
//                   <input
//                     type="date"
//                     value={filters.startDate}
//                     onChange={(e) => setFilters((prev: any) => ({ ...prev, startDate: e.target.value, page: 1 }))}
//                     className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
//                   />
//                 </div>
//               </div>
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">End Date</label>
//                 <div className="relative">
//                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
//                   <input
//                     type="date"
//                     value={filters.endDate}
//                     onChange={(e) => setFilters((prev: any) => ({ ...prev, endDate: e.target.value, page: 1 }))}
//                     className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
//                   />
//                 </div>
//               </div>
//               {(filters.startDate || filters.endDate) && (
//                 <button
//                   onClick={() => setFilters((prev: any) => ({ ...prev, startDate: "", endDate: "", page: 1 }))}
//                   className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-white transition-colors h-[38px]"
//                 >
//                   Clear dates
//                 </button>
//               )}
//             </div>
//           )}

//           {/* Table */}
//           {isLoading ? (
//             <div className="p-6 space-y-3">
//               {[...Array(6)].map((_, i) => (
//                 <div key={i} className="flex gap-4">
//                   <div className="skeleton h-4 w-32" /><div className="skeleton h-4 flex-1" /><div className="skeleton h-4 w-24" />
//                 </div>
//               ))}
//             </div>
//           ) : filteredMeters.length === 0 ? (
//             <div className="py-20 text-center">
//               <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
//                 <Gauge className="w-6 h-6 text-gray-400" />
//               </div>
//               <p className="text-sm font-semibold text-gray-700">No meters found</p>
//               <p className="text-xs text-gray-400 mt-1">
//                 {searchQuery ? "Try a different search term" : "Add your first meter to get started"}
//               </p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="bg-gray-50 border-b border-gray-100">
//                     {[
//                       { label: "Meter", field: "meterNumber", sortable: true },
//                       { label: "Location", field: "location", sortable: true },
//                       { label: "Account", field: null, sortable: false },
//                       { label: "Deficit", field: "openingDeficit", sortable: true },
//                       { label: "Total Revenue", field: "totalAmount", sortable: true },
//                       { label: "Total Units", field: "totalUnits", sortable: true },
//                     ].map(({ label, field, sortable }) => (
//                       <th
//                         key={label}
//                         onClick={() => sortable && field && handleSort(field)}
//                         className={`px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap
//                           ${sortable ? "cursor-pointer hover:text-gray-600 select-none" : ""}`}
//                       >
//                         <div className="flex items-center gap-1.5">
//                           {label}
//                           {sortable && field && <SortIcon field={field} />}
//                         </div>
//                       </th>
//                     ))}
//                     {isAdmin && <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" >
//                       Actions
//                       </th>}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {filteredMeters.map((meter: Meter, idx: number) => {
//                     const account = accounts.find((a: Account) => a.id === meter.accountId);
//                     return (
//                       <tr
//                         key={meter.id}
//                         className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-blue-50/30 transition-colors group`}
//                       >
//                         {/* Meter Number */}
//                         <td className="px-5 py-3.5 whitespace-nowrap">
//                           <div className="flex items-center gap-2.5">
//                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
//                             <span className="font-mono-custom text-xs font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
//                               {meter.meterNumber}
//                             </span>
//                             {meter.make && (
//                               <span className="text-xs text-gray-400 font-medium">{meter.make}</span>
//                             )}
//                           </div>
//                         </td>

//                         {/* Location */}
//                         <td className="px-5 py-3.5 whitespace-nowrap">
//                           <div className="flex items-center gap-1.5 text-gray-600">
//                             <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
//                             <span className="text-sm">{meter.location}</span>
//                           </div>
//                         </td>

//                         {/* Account */}
//                         <td className="px-5 py-3.5 whitespace-nowrap">
//                           {account ? (
//                             <div className="flex items-center gap-1.5">
//                               <Building2 className="w-3 h-3 text-gray-400" />
//                               <span className="text-sm text-gray-600">{account.name}</span>
//                             </div>
//                           ) : (
//                             <span className="text-xs text-gray-400 italic">No account</span>
//                           )}
//                         </td>

//                         {/* Deficit */}
//                         <td className="px-5 py-3.5 whitespace-nowrap">
//                           {meter.openingDeficit > 0 ? (
//                             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
//                               <AlertCircle className="w-3 h-3" />
//                               {fmt(meter.openingDeficit)}
//                             </span>
//                           ) : (
//                             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
//                               <CheckCircle2 className="w-3 h-3" />
//                               Clear
//                             </span>
//                           )}
//                         </td>

//                         {/* Total Amount */}
//                         <td className="px-5 py-3.5 whitespace-nowrap">
//                           <span className="text-sm font-semibold text-gray-900">{fmt(meter.totalAmount || 0)}</span>
//                         </td>

//                         {/* Total Units */}
//                         <td className="px-5 py-3.5 whitespace-nowrap">
//                           <div className="flex items-center gap-1">
//                             <Zap className="w-3 h-3 text-amber-400" />
//                             <span className="text-sm text-gray-700">{(meter.totalUnits || 0).toFixed(2)}</span>
//                           </div>
//                         </td>

//                         {/* Actions */}
//                         {isAdmin && (
//                           <td className="px-5 py-3.5 whitespace-nowrap text-right">
//                             <div className="text-gray-400 group-hover:text-blue-400 transition-all">
//                               <RowMenu
//                                 meter={meter}
//                                 onEdit={(m: any) => { setEditingMeter(m); setFormOpen(true); }}
//                                 onView={(m: any) => { setActionsMeter(m); setActionsOpen(true); }}
//                                 onDelete={(m: any) => setDeleteMeter(m)}
//                               />
//                             </div>
//                           </td>
//                         )}
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {/* ── Pagination Footer ── */}
//           <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <p className="text-xs text-gray-400">
//                 Showing <span className="font-medium text-gray-600">{fmtNum(((metersData.pagination.page - 1) * metersData.pagination.limit) + 1)}</span>–<span className="font-medium text-gray-600">{fmtNum(Math.min(metersData.pagination.page * metersData.pagination.limit, metersData.pagination.total))}</span> of <span className="font-medium text-gray-600">{fmtNum(metersData.pagination.total)}</span>
//               </p>
//               <div className="flex items-center gap-1.5">
//                 <span className="text-xs text-gray-400">Rows:</span>
//                 <select
//                   value={filters.limit}
//                   onChange={(e) => handleLimitChange(Number(e.target.value))}
//                   className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-600 focus:outline-none"
//                 >
//                   {[10, 20, 50, 100].map((l) => <option key={l} value={l}>{l}</option>)}
//                 </select>
//               </div>
//             </div>

//             <div className="flex items-center gap-1">
//               <button
//                 onClick={() => handlePageChange(metersData.pagination.page - 1)}
//                 disabled={!metersData.pagination.hasPrevPage || isLoading}
//                 className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//               >
//                 <ChevronLeft className="w-3.5 h-3.5" />
//                 Prev
//               </button>
//               {[...Array(Math.min(5, metersData.pagination.totalPages))].map((_, i) => {
//                 const p = i + 1;
//                 return (
//                   <button
//                     key={p}
//                     onClick={() => handlePageChange(p)}
//                     className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors ${metersData.pagination.page === p ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 border border-gray-200 bg-white hover:bg-gray-50"}`}
//                   >
//                     {p}
//                   </button>
//                 );
//               })}
//               {metersData.pagination.totalPages > 5 && <span className="text-xs text-gray-400 px-1">…</span>}
//               <button
//                 onClick={() => handlePageChange(metersData.pagination.page + 1)}
//                 disabled={!metersData.pagination.hasNextPage || isLoading}
//                 className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//               >
//                 Next
//                 <ChevronRight className="w-3.5 h-3.5" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Dialogs */}
//       <MeterFormDialog
//         open={formOpen}
//         onClose={() => { setFormOpen(false); setEditingMeter(null); }}
//         editing={editingMeter}
//         tariffs={tariffs}
//         accounts={accounts}
//         onSubmit={handleSubmit}
//         isSaving={isSaving}
//       />
//       <MeterActionsDialog
//         open={actionsOpen}
//         onClose={() => { setActionsOpen(false); setActionsMeter(null); }}
//         meter={actionsMeter}
//         axiosInstance={axiosInstance}
//       />
//       {deleteMeter && (
//         <DeleteDialog
//           meter={deleteMeter}
//           onConfirm={handleConfirmDelete}
//           onClose={() => setDeleteMeter(null)}
//         />
//       )}
//       <Toaster position="top-right" richColors />
//     </div>
//   );
// }

// export default MetersPage;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search, Filter, X, LoaderIcon, Eye } from "lucide-react";
import { getAllMeters, createMeter, updateMeter, deleteMeter, generateMeterCredit, generateTamperCode } from '../api/meters.api';
import type { Meter } from '../api/meters.api';
import { getTariffs } from "../../api/tariffs.api"
import { toast, Toaster } from 'sonner';
import useAxiosWithAuth from "@/../utils/axiosInterceptor";

const Meters: React.FC = () => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API)
  const [meters, setMeters] = useState<Meter[]>([]);
  const [filteredMeters, setFilteredMeters] = useState<Meter[]>([]);
  const [open, setOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minDeficit, setMinDeficit] = useState<number | ''>('');
  const [maxDeficit, setMaxDeficit] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  //@ts-ignore
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(false);
  const [tariffs, setTariffs] = useState<any[]>([]);

  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    meterNumber: '',
    location: '',
    openingDeficit: 0,
    tariffId: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  const fetchMeters = async () => {
    try {
      setIsLoading(true)
      const data = await getAllMeters(axiosInstance);
      setMeters(data);
      setFilteredMeters(data);
    } catch (error) {
      console.error('Error fetching meters:', error);
    } finally {
      setIsLoading(false)
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

  useEffect(() => {
    fetchMeters();
    fetchTariffs()
  }, []);

  // Apply search and filters whenever they change
  useEffect(() => {
    let result = meters;

    // Apply search
    if (searchQuery) {
      result = result.filter(meter =>
        meter.meterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meter.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply location filter
    if (locationFilter) {
      result = result.filter(meter =>
        meter.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Apply deficit range filter
    if (minDeficit !== '') {
      result = result.filter(meter => meter.openingDeficit >= minDeficit);
    }
    if (maxDeficit !== '') {
      result = result.filter(meter => meter.openingDeficit <= maxDeficit);
    }

    setFilteredMeters(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, locationFilter, minDeficit, maxDeficit, meters]);

  const handleOpen = (meter?: Meter) => {
    if (meter) {
      setEditingMeter(meter);
      setFormData({
        meterNumber: meter.meterNumber,
        location: meter.location,
        openingDeficit: meter.openingDeficit,
        tariffId: meter.tariffId || '',
      });
    } else {
      setEditingMeter(null);
      setFormData({
        meterNumber: '',
        location: '',
        openingDeficit: 0,
        tariffId: '',
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

  const resetFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setMinDeficit('');
    setMaxDeficit('');
  };

  // Calculate pagination values
  const totalPages = Math.ceil(filteredMeters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMeters = filteredMeters.slice(startIndex, endIndex);

  // Get unique locations for filter dropdown
  const uniqueLocations = [...new Set(meters.map(meter => meter.location))];


  const meter = editingMeter || currentMeters[0];
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [tamperCode, setTamperCode] = useState<string | null>(null);
  const [creditCode, setCreditCode] = useState<string | null>(null);
  const [isTamperLoading, setIsTamperLoading] = useState(false);
  const [isCreditLoading, setIsCreditLoading] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meters</h1>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Meter
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meters by number or location..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <X
              className="absolute right-3 top-3 h-4 w-4 text-muted-foreground cursor-pointer"
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>

          {(locationFilter || minDeficit !== '' || maxDeficit !== '') && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              Clear filters
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div className="grid gap-2">
              <label htmlFor="location-filter" className="text-sm font-medium">
                Location
              </label>
              <select
                id="location-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="min-deficit" className="text-sm font-medium">
                Min Deficit (Ksh)
              </label>
              <Input
                id="min-deficit"
                type="number"
                placeholder="Minimum"
                value={minDeficit}
                onChange={(e) => setMinDeficit(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="max-deficit" className="text-sm font-medium">
                Max Deficit (Ksh)
              </label>
              <Input
                id="max-deficit"
                type="number"
                placeholder="Maximum"
                value={maxDeficit}
                onChange={(e) => setMaxDeficit(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100">
              <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Meter Number</TableHead>
              <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Location</TableHead>
              <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Deficit (Ksh)</TableHead>
              <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpen(meter)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-150"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(meter.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-150"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => (
                            setActionDialogOpen(true),
                            setSelectedMeter(meter)
                          )}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 transition-all duration-150"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
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
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredMeters.length)} of {filteredMeters.length} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
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
        <DialogContent className="bg-white, max-h-90vh overflow-y-auto">
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
                setTamperCode(response[0].Token || response.split(",")[0]);
              } catch (err) {
                toast.error("Failed to generate clear tamper code");
              } finally {
                setIsTamperLoading(false);
              }
            };

            const generateCredit = async (meterId: string, meterNumber: any, amount: number) => {
              setIsCreditLoading(true);
              setCreditCode(null);
              try {
                const response = await generateMeterCredit(axiosInstance, {
                  meterId,
                  meterNumber,
                  amount
                })
                setCreditCode(response[0].Token);
              } catch (err) {
                toast.error("Failed to generate credit code");
              } finally {
                setIsCreditLoading(false);
              }
            };

            if (!meter) {
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

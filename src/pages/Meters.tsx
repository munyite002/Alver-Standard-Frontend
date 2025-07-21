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
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search, Filter, X, LoaderIcon } from "lucide-react";
import { getAllMeters, createMeter, updateMeter, deleteMeter } from '../api/meters.api';
import type { Meter } from '../api/meters.api';
import { toast, Toaster } from 'sonner';

const Meters: React.FC = () => {
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

  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    meterNumber: '',
    location: '',
    openingDeficit: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchMeters = async () => {
    try {
      setIsLoading(true)
      const data = await getAllMeters();
      setMeters(data);
      setFilteredMeters(data);
    } catch (error) {
      console.error('Error fetching meters:', error);
    } finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    fetchMeters();
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
      });
    } else {
      setEditingMeter(null);
      setFormData({
        meterNumber: '',
        location: '',
        openingDeficit: 0,
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
        await updateMeter(editingMeter.id, formData);
        toast.success('Meter updated successfully');
      } else {
        await createMeter(formData);
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
        await deleteMeter(id);
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
            <TableRow>
              <TableHead>Meter Number</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Deficit (Ksh)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <div className="w-full flex items-center justify-center py-6">
                    <LoaderIcon className="h-10 w-10 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {currentMeters.length > 0 ? (
                currentMeters.map((meter) => (
                  <TableRow key={meter.id}>
                    <TableCell>{meter.meterNumber}</TableCell>
                    <TableCell>{meter.location}</TableCell>
                    <TableCell>{meter.openingDeficit}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpen(meter)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(meter.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No meters found matching your criteria
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingMeter ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Toaster position='top-right' richColors />
    </div>
  );
};

export default Meters;
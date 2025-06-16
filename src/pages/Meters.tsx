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
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllMeters, createMeter, updateMeter, deleteMeter } from '../api/meters.api';
import type { Meter } from '../api/meters.api';
import { toast, Toaster } from 'sonner';

const Meters: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [open, setOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    meterNumber: '',
    location: '',
    openingDeficit: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const fetchMeters = async () => {
    try {
      const data = await getAllMeters();
      setMeters(data);
    } catch (error) {
      console.error('Error fetching meters:', error);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, []);

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

  // Calculate pagination values
  const totalPages = Math.ceil(meters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMeters = meters.slice(startIndex, endIndex);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meters</h1>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Meter
        </Button>
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
          <TableBody>
            {currentMeters.map((meter) => (
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1} to {Math.min(endIndex, meters.length)} of {meters.length} entries
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
      <Toaster position='top-right' richColors/>
    </div>
  );
};

export default Meters; 
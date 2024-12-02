'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getLeadDocuments, LeadDocument, deleteLeadDocument } from '@/utils/supabase/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileIcon, FileText, X } from 'lucide-react';
import { AddDocumentForm } from './AddDocumentForm';
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface LeadDocumentsProps {
  leadId: string;
}

export function LeadDocuments({ leadId }: LeadDocumentsProps) {
  const [documents, setDocuments] = useState<LeadDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await getLeadDocuments(supabase, leadId);
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (document: LeadDocument) => {
    try {
      const supabase = createClient();
      await deleteLeadDocument(supabase, {
        id: document.id,
        file_url: document.file_url
      });

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      loadDocuments(); // Reload the list
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [leadId]);

  if (loading) return <div>Loading documents...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <AddDocumentForm leadId={leadId} onSuccess={loadDocuments} />
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-4">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center space-x-4">
                <FileIcon className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <a 
                    href={document.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {document.name}
                  </a>
                  <p className="text-sm text-muted-foreground">
                    {document.file_type} • {(document.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Document</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{document.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(document)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 
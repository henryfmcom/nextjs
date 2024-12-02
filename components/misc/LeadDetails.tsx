'use client';

import { Lead } from '@/types/crm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, Globe, User, Calendar } from 'lucide-react';
import { LeadConversionDialog } from './LeadConversionDialog';
import { LeadFollowUps } from './LeadFollowUps';
import { LeadActivities } from './LeadActivities';
import { LeadDocuments } from './LeadDocuments';

interface LeadDetailsProps {
  lead: Lead;
}

export function LeadDetails({ lead }: LeadDetailsProps) {
  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Company Details Card */}
      <Card>
        <CardHeader className="px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-2xl truncate">{lead.company_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{lead.industry}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant={lead.status === 'qualified' ? 'default' : 'secondary'}>
              {lead.status}
            </Badge>
            {!lead.is_converted && (
              <LeadConversionDialog 
                leadId={lead.id} 
                companyName={lead.company_name} 
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <span className="text-sm">Stage: {lead.current_stage?.name}</span>
              </div>
              {lead.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <a 
                    href={lead.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm hover:underline break-all"
                  >
                    {lead.website}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <span className="text-sm">Source: {lead.source?.name}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm truncate">{lead.contact_name}</span>
                  {lead.contact_title && (
                    <span className="text-xs text-muted-foreground truncate">
                      {lead.contact_title}
                    </span>
                  )}
                </div>
              </div>
              {lead.contact_email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <a 
                    href={`mailto:${lead.contact_email}`}
                    className="text-sm hover:underline break-all"
                  >
                    {lead.contact_email}
                  </a>
                </div>
              )}
              {lead.contact_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{lead.contact_phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {lead.notes && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
              {lead.notes}
            </p>
          </div>
        )}

        {/* Footer Information */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
            </div>
            {lead.assigned_to && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0" />
                <span>
                  Assigned to: {lead.assigned_to.given_name} {lead.assigned_to.surname}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      </Card>

      {/* Follow-ups and Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <LeadFollowUps leadId={lead.id} />
        <LeadActivities leadId={lead.id} />
      </div>

      {/* Documents Section */}
      <LeadDocuments leadId={lead.id} />
    </div>
  );
}
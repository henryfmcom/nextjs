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
    <div className="space-y-6">
      {/* Company Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{lead.company_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{lead.industry}</p>
          </div>
          <div className="flex items-center space-x-2">
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Company Information</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Stage: {lead.current_stage?.name}</span>
                </div>
                {lead.website && (
                  <div className="flex items-center text-sm">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a 
                      href={lead.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {lead.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Source: {lead.source?.name}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{lead.contact_name}</span>
                  {lead.contact_title && (
                    <span className="text-muted-foreground ml-2">
                      ({lead.contact_title})
                    </span>
                  )}
                </div>
                {lead.contact_email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a 
                      href={`mailto:${lead.contact_email}`}
                      className="hover:underline"
                    >
                      {lead.contact_email}
                    </a>
                  </div>
                )}
                {lead.contact_phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{lead.contact_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Created: {new Date(lead.created_at).toLocaleDateString()}
              </div>
              {lead.assigned_to && (
                <div>
                  Assigned to: {lead.assigned_to.given_name} {lead.assigned_to.surname}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups and Activities Grid */}
      <div className="grid grid-cols-2 gap-6">
        <LeadFollowUps leadId={lead.id} />
        <LeadActivities leadId={lead.id} />
      </div>

      {/* Documents Section */}
      <LeadDocuments leadId={lead.id} />
    </div>
  );
} 
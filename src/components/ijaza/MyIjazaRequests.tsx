import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface IjazaRequest {
  id: string;
  sheikhId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  preferredLanguage: string;
  preferredTime: string | null;
  experience: string | null;
  motivation: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'completed';
  scheduledDate: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface Sheikh {
  id: string;
  name: string;
}

interface MyIjazaRequestsProps {
  requests: IjazaRequest[];
  sheikhs: Sheikh[];
  getStatusLabel: (status: IjazaRequest['status']) => string;
  getStatusColor: (status: IjazaRequest['status']) => string;
}

export const MyIjazaRequests: React.FC<MyIjazaRequestsProps> = ({
  requests,
  sheikhs,
  getStatusLabel,
  getStatusColor,
}) => {
  const { t } = useLanguage();

  const getSheikhName = (sheikhId: string | null) => {
    if (!sheikhId) return t.ijazaNotAssigned;
    const sheikh = sheikhs.find(s => s.id === sheikhId);
    return sheikh?.name || t.ijazaUnknown;
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          {t.ijazaMyRequestsTitle}
        </CardTitle>
        <CardDescription>
          {t.ijazaMyRequestsDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {t.ijazaRequestDate} {format(new Date(request.createdAt), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{t.ijazaSheikh}: {getSheikhName(request.sheikhId)}</span>
                      </div>
                      
                      {request.preferredTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{t.ijazaTimeSlot}: {request.preferredTime}</span>
                        </div>
                      )}
                      
                      {request.scheduledDate && (
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {t.ijazaScheduledSession} {format(new Date(request.scheduledDate), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      )}
                      
                      {request.rejectionReason && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                          {t.ijazaReason}: {request.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

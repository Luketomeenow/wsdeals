import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Mail, Phone, MapPin, Building2, MoreHorizontal, MessageSquare } from "lucide-react";
import { ClickToCall } from "@/components/calls/ClickToCall";
import { SendSMSDialog } from "@/components/sms/SendSMSDialog";
import { useNavigate } from "react-router-dom";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  lifecycle_stage?: string;
  created_at: string;
  companies?: { name: string };
}

interface ContactListViewProps {
  contacts: Contact[];
}

const stageColors = {
  lead: "secondary",
  prospect: "warning",
  qualified: "primary",
  customer: "success",
  evangelist: "success"
} as const;

export function ContactListView({ contacts }: ContactListViewProps) {
  const navigate = useNavigate();
  
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow 
              key={contact.id} 
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() => navigate(`/deals?contact=${contact.id}`)}
            >
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {contact.first_name?.[0]}{contact.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{contact.companies?.name || "No company"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{contact.email || "No email"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {contact.phone ? (
                    <>
                      <span className="text-sm">{contact.phone}</span>
                      <ClickToCall 
                        phoneNumber={contact.phone}
                        contactId={contact.id}
                        variant="ghost"
                        size="icon"
                      />
                      <SendSMSDialog 
                        phoneNumber={contact.phone}
                        contactId={contact.id}
                      >
                        <Button variant="ghost" size="icon">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </SendSMSDialog>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No phone</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">
                    {[contact.city, contact.state].filter(Boolean).join(', ') || "No location"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {contact.lifecycle_stage && (
                  <Badge variant={stageColors[contact.lifecycle_stage as keyof typeof stageColors] || "secondary"}>
                    {contact.lifecycle_stage}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {new Date(contact.created_at).toLocaleDateString()}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                    <DropdownMenuItem>Send Email</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete Contact</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {contacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No contacts found</p>
        </div>
      )}
    </div>
  );
}
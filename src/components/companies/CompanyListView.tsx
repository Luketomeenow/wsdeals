import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Globe, Phone, MapPin, MoreHorizontal, Users, MessageSquare } from "lucide-react";
import { ClickToCall } from "@/components/calls/ClickToCall";
import { SendSMSDialog } from "@/components/sms/SendSMSDialog";

interface Company {
  id: string;
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  created_at: string;
  industry?: string;
  employees_count?: number;
  city?: string;
  state?: string;
}

interface CompanyListViewProps {
  companies: Company[];
}

export function CompanyListView({ companies }: CompanyListViewProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Employees</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{company.name}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{company.industry || "Not specified"}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  {company.website ? (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">No website</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {company.phone ? (
                    <>
                      <span className="text-sm">{company.phone}</span>
                      <ClickToCall 
                        phoneNumber={company.phone}
                        companyId={company.id}
                        variant="ghost"
                        size="icon"
                      />
                      <SendSMSDialog 
                        phoneNumber={company.phone}
                        companyId={company.id}
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
                    {[company.city, company.state].filter(Boolean).join(', ') || company.address || "No location"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">
                    {company.employees_count ? `${company.employees_count.toLocaleString()}` : "Unknown"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {new Date(company.created_at).toLocaleDateString()}
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
                    <DropdownMenuItem>Edit Company</DropdownMenuItem>
                    <DropdownMenuItem>View Contacts</DropdownMenuItem>
                    <DropdownMenuItem>View Deals</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete Company</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {companies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No companies found</p>
        </div>
      )}
    </div>
  );
}
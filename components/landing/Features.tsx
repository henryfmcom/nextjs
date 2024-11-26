'use client';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

interface FeatureProps {
  title: string;
  description: string;
  image: string;
}

const features: FeatureProps[] = [
  {
    title: 'Employee & Contract Management',
    description:
      'Comprehensive employee management with support for multiple contracts, positions, and departments. Track contract details including salary, rates, and terms.',
    image: '/landing/looking-ahead.png'
  },
  {
    title: 'Time & Attendance',
    description:
      'Flexible work log management with support for multiple schedules, overtime calculation, and bulk operations. Integrated holiday management and approval workflow.',
    image: '/landing/reflecting.png'
  },
  {
    title: 'Payroll & Resource Planning',
    description:
      'Automated payroll processing with overtime calculations and status tracking. Efficient resource allocation with workload visualization and project planning.',
    image: '/landing/growth.png'
  }
];

const featureList: string[] = [
  'Multi-tenant Support',
  'Dark/Light Theme',
  'Employee Management',
  'Contract Management',
  'Work Scheduling',
  'Time Tracking',
  'Payroll Processing',
  'Project Management',
  'Resource Allocation',
  'Knowledge Management',
  'Client Management',
  'Bulk Operations',
  'Approval Workflows'
];

export const Features = () => {
  return (
    <section id="features" className="container py-24 sm:py-32 space-y-8">
      <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
        Powerful{' '}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          HR Features
        </span>
      </h2>

      <div className="flex flex-wrap md:justify-center gap-4">
        {featureList.map((feature: string) => (
          <div key={feature}>
            <Badge variant="secondary" className="text-sm">
              {feature}
            </Badge>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(({ title, description, image }: FeatureProps) => (
          <Card key={title} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>

            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{description}</p>
            </CardContent>

            <CardFooter>
              <img
                src={image}
                alt={`${title} feature illustration`}
                className="w-[200px] lg:w-[300px] mx-auto"
              />
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <h3 className="text-2xl font-bold mb-4">
          Built for Modern HR Management
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our platform combines powerful features with an intuitive interface to help you 
          manage your workforce efficiently. From employee onboarding to payroll processing, 
          we've got you covered with a complete suite of HR tools.
        </p>
      </div>
    </section>
  );
};

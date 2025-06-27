import { Briefcase, Tag, Repeat, CalendarCheck, Users, Star } from "lucide-react"

const benefits = [
  {
    title: "Qualified Leads Only",
    description: "We vet homeowners so you get real jobs — not just clicks.",
    icon: <Briefcase className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "Flexible Pricing",
    description: "Choose pay-per-lead or monthly plans depending on what works for you.",
    icon: <Tag className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "Fewer Competitors Per Job",
    description: "No lead overload. We limit how many providers get each request.",
    icon: <Users className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "Recurring Clients",
    description: "Win customers who return seasonally or for future projects.",
    icon: <Repeat className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "Easy Scheduling",
    description: "Let customers book your available time slots instantly.",
    icon: <CalendarCheck className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
  {
    title: "Review Visibility",
    description: "Stand out with verified reviews and trust-building badges.",
    icon: <Star className="h-6 w-6 text-indigo-600" aria-hidden="true" role="img" />,
  },
]

export function ProviderBenefits() {
  return (
    <section className="section bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900">Why Providers Choose RivoHome</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Designed to support service providers with qualified leads, tools, and flexible pricing.
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                {benefit.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 
import { use } from "react"
import { BlogPostLayout } from "@/components/blog/blog-post-layout"

interface BlogPostParams {
  params: Promise<{
    slug: string
  }>
}

export default function BlogPost({ params }: BlogPostParams) {
  const resolvedParams = use(params)
  // In a real app, you would fetch blog data based on the slug
  // This is just example data
  const blogData = {
    title: "10 Home Maintenance Tasks You're Probably Forgetting",
    author: {
      name: "Jamie Wilson",
      avatar: "/images/blog/authors/jamie.jpg" // You'll need to add this image
    },
    date: "2023-11-15",
    readingTime: "6 min read",
    featuredImage: "/images/blog/home-maintenance.jpg", // You'll need to add this image
    content: `
      <h2>Why Regular Home Maintenance Matters</h2>
      <p>
        Regular home maintenance isn't just about keeping your space looking good—it's about protecting your investment
        and ensuring your home remains safe, comfortable, and efficient for years to come.
      </p>
      
      <p>
        According to a study by the National Association of Home Builders, proper maintenance can extend the life of your
        home by decades and save you thousands in unexpected repair costs.
      </p>
      
      <h2>The Hidden Tasks You Might Be Missing</h2>
      
      <h3>1. Clean Your Refrigerator Coils</h3>
      <p>
        Did you know that dirty refrigerator coils can increase your energy usage by up to 35%? These coils, usually located
        on the back or bottom of your refrigerator, collect dust over time and make your fridge work harder than it needs to.
      </p>
      
      <blockquote>
        "Cleaning your refrigerator coils twice a year can extend the life of your appliance by years and save you hundreds 
        in energy costs." - Home Maintenance Expert
      </blockquote>
      
      <h3>2. Check for Water Leaks</h3>
      <p>
        Even small water leaks can waste thousands of gallons per year and lead to mold, mildew, and structural damage.
        Check under sinks, around toilets, and inspect your water heater regularly for signs of leaking.
      </p>
      
      <h3>3. Test Your Smoke and Carbon Monoxide Detectors</h3>
      <p>
        This simple task that takes seconds can literally save lives. <a href="#">The U.S. Fire Administration</a> recommends
        testing your detectors monthly and replacing batteries at least once a year.
      </p>
    `
  }

  return (
    <BlogPostLayout
      title={blogData.title}
      author={blogData.author}
      date={blogData.date}
      readingTime={blogData.readingTime}
      featuredImage={blogData.featuredImage}
    >
      <div dangerouslySetInnerHTML={{ __html: blogData.content }} />
    </BlogPostLayout>
  )
}


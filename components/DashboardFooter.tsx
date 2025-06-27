/**
 * Footer component for dashboard pages with GRAIsol attribution
 */

export default function DashboardFooter() {
  return (
    <footer className="mt-12 py-4 text-center">
      <p className="text-xs text-gray-500">
        Developed by{' '}
        <a 
          href="https://graisol.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          GRAIsol
        </a>
      </p>
    </footer>
  );
} 
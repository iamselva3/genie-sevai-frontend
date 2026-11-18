import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../lib/hooks';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col items-start px-4 pt-12 md:px-8 md:pt-20">
      <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-mute">Error 404</p>
      <h1 className="display mt-4 text-[48px] font-semibold md:text-[72px]">
        Wrong <span className="mark">door.</span>
      </h1>
      <p className="mt-6 max-w-md text-[17px] text-mute">This page doesn’t exist, but the rest of your to-do list does.</p>
      <Link to="/" className="mt-8 inline-flex h-12 items-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-white">
        Back to home
      </Link>
    </div>
  );
}

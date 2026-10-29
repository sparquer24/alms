// Re-mounts on each page change inside this section (the layout itself
// persists), giving the content area a short fade-in. Flex classes keep the
// wrapper transparent to the layout's flex column.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className='alms-page-enter flex-grow flex flex-col min-h-0'>{children}</div>;
}

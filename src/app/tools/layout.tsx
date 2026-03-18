// Layout para la página de herramientas que quedó fuera del enrutador [lang]
export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

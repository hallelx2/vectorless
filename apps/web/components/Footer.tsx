import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-bg-dark text-white py-20 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="md:col-span-2">
            <Link href="/" className="font-display text-[24px] font-medium tracking-tight text-white block mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500"></span>
              Vectorless
            </Link>
            <p className="text-[#9ca3af] text-[16px] font-medium leading-[1.50]">
              The retrieval platform for the reasoning era.
            </p>
          </div>
          
          <div>
            <h4 className="font-mid text-[14px] font-medium text-[#9ca3af] mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link href="#how-it-works" className="text-[16px] font-medium text-[#f3f4f6] hover:text-primary-400 transition-colors">How It Works</Link></li>
              <li><Link href="#docs" className="text-[16px] font-medium text-[#f3f4f6] hover:text-primary-400 transition-colors">Docs</Link></li>
              <li><Link href="#sdk" className="text-[16px] font-medium text-[#f3f4f6] hover:text-primary-400 transition-colors">SDK</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mid text-[14px] font-medium text-[#9ca3af] mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-[16px] font-medium text-[#f3f4f6] hover:text-primary-400 transition-colors">About</Link></li>
              <li><Link href="#" className="text-[16px] font-medium text-[#f3f4f6] hover:text-primary-400 transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-[16px] font-medium text-[#f3f4f6] hover:text-primary-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[#374151] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#9ca3af] text-[14px] font-medium">
            © 2025 Vectorless. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-[#9ca3af] hover:text-primary-400 text-[14px] font-medium transition-colors">GitHub</Link>
            <Link href="#" className="text-[#9ca3af] hover:text-primary-400 text-[14px] font-medium transition-colors">Twitter / X</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

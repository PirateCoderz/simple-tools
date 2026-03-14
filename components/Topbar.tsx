"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuLinks = [
  { label: "HOME", href: "/" },
  { label: "IMAGES", href: "/images" },
  { label: "ABOUT", href: "/about" },
//   { 
//     label: "WIDGETS", 
//     href: "/widgets",
//     dropdown: [
//       { label: "Widget 1", href: "/widgets/widget-1" },
//       { label: "Widget 2", href: "/widgets/widget-2" },
//       { label: "Widget 3", href: "/widgets/widget-3" },
//     ]
//   },
//   { 
//     label: "TEMPLATES", 
//     href: "/templates",
//     dropdown: [
//       { label: "Template 1", href: "/templates/template-1" },
//       { label: "Template 2", href: "/templates/template-2" },
//       { label: "Template 3", href: "/templates/template-3" },
//     ]
//   },
//   { 
//     label: "SHORTCODES", 
//     href: "/shortcodes",
//     dropdown: [
//       { label: "Shortcode 1", href: "/shortcodes/shortcode-1" },
//       { label: "Shortcode 2", href: "/shortcodes/shortcode-2" },
//       { label: "Shortcode 3", href: "/shortcodes/shortcode-3" },
//     ]
//   },
  { label: "BLOG", href: "/blog" },
  { label: "CONTACT", href: "/contact" },
//   { label: "PURCHASE", href: "/purchase" },
];

export default function Topbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const isLightNav = pathname?.startsWith("/images") ?? false;
    const navClass = isLightNav
        ? "fixed top-0 left-0 w-full bg-white/95 text-foreground border-b border-border shadow-sm z-50"
        : "fixed top-0 left-0 w-full bg-transparent text-white shadow-lg z-50";

    const closeMenu = () => setShowMobileMenu(false);

    return (
        <nav className={navClass}>
            {/* Mobile Top Bar */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3">
                <button 
                    onClick={() => setShowMobileMenu(true)} 
                    className="flex items-center gap-1"
                    aria-label="Open navigation menu"
                >
                    <FiMenu size={22} />
                    <span className="text-xs">Menu</span>
                </button>

                <div className={`text-xl font-bold ${isLightNav ? "text-foreground" : ""}`}>
                    <Link href="/">StartUp</Link>
                </div>

                {session && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                        {session.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                )}
            </div>

            {/* Mobile Overlay */}
            {showMobileMenu && (
                <div 
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
                    onClick={closeMenu}
                />
            )}

            {/* Mobile Menu */}
            <nav 
                className={`fixed top-0 right-0 h-full w-64 bg-white text-[#161616] z-50 transform transition-transform duration-300 overflow-y-auto ${
                    showMobileMenu ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between px-4 py-4 bg-emerald-500 text-white">
                    <h2 className="font-semibold text-lg">Menu</h2>
                    <button onClick={closeMenu} aria-label="Close navigation menu">
                        <FiX size={26} />
                    </button>
                </div>
                <ul className="space-y-1 py-2">
                    {menuLinks.map((item: any) => (
                        <li key={item.label}>
                            {item.dropdown ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-100 outline-none text-[#161616] sm:text-[#c1c1c1]">
                                            <span>{item.label}</span>
                                            <FiChevronDown size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        {item?.dropdown?.map((subItem: any) => (
                                            <DropdownMenuItem key={subItem.label} asChild>
                                                <Link
                                                    href={subItem.href}
                                                    className="cursor-pointer"
                                                    onClick={closeMenu}
                                                >
                                                    {subItem.label}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="block w-full px-4 py-3 hover:bg-gray-100 text-[#161616] sm:text-[#c1c1c1]"
                                    onClick={closeMenu}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    ))}
                    {session && (
                        <li className="border-t pt-2 mt-2">
                            <button
                                onClick={() => {
                                    signOut({ callbackUrl: "/signin" });
                                    closeMenu();
                                }}
                                className="block w-full px-4 py-3 text-left text-red-600 hover:bg-gray-100"
                            >
                                Sign Out
                            </button>
                        </li>
                    )}
                </ul>
            </nav>

            {/* Desktop Navbar */}
            <div className="hidden lg:flex justify-between items-center px-6 py-3">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <span className={`text-xl font-bold ${isLightNav ? "text-foreground" : "text-gray-200"}`}>StartUp</span>
                </Link>

                <div className="flex gap-1 items-center">
                    {menuLinks.map((item: any) => (
                        item.dropdown ? (
                            <DropdownMenu key={item.label}>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-1 px-4 py-2 hover:text-emerald-500 transition-colors text-sm font-medium outline-none">
                                        {item.label}
                                        <FiChevronDown size={14} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[200px] bg-black/50 text-white">
                                    {item.dropdown.map((subItem: {label: string, href: string}) => (
                                        <DropdownMenuItem key={subItem.label} asChild>
                                            <Link
                                                href={subItem.href}
                                                className="cursor-pointer"
                                            >
                                                {subItem.label}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-1 px-4 py-2 hover:text-emerald-500 transition-colors text-sm font-medium"
                            >
                                {item.label}
                            </Link>
                        )
                    ))}
                </div>

                {/* Profile & Sign Out */}
                <div className="flex items-center gap-4">
                    {session ? (
                        <>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <span className={`text-sm font-medium ${isLightNav ? "text-foreground" : "text-slate-200"}`}>
                                    {session.user?.name}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/signin" })}
                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-md"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/signin" className={`px-4 py-2 text-sm font-medium hover:text-emerald-600 transition-colors ${isLightNav ? "text-foreground" : "text-slate-100"}`}>
                                Sign In
                            </Link>
                            <Link href="/signup" className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

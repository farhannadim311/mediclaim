import { cn } from "@/lib/utils"



export const DawnLogo = ({ size = 'md' }: { size?: 'md' | 'lg' }) => {
    const svgSize =  size === 'md' ? '32' : '90';
    const textSize = size === 'md' ? 'text-lg md:text-xl' : 'text-2xl md:text-5xl';
    const imgSize =  size === 'md' ? 'w-16 md:w-20' : 'w-24 md:w-40';
    const poweredBySize = size === 'md' ? 'text-sm md:text-base' : 'text-base md:text-2xl';
    return (
        <div
            className="flex px-3 mx-6 py-2 items-center gap-3 rounded-lg transition-all duration-300 hover:bg-gray-800/50 cursor-pointer h-fit"
            data-testid="header-logo"
        >
            {/* Sun SVG Icon */}
            <div className="flex-shrink-0">
                <svg
                    width={svgSize}
                    height={svgSize}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-orange-400"
                >
                    {/* Sun rays */}
                    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="16" y1="2" x2="16" y2="4" />
                        <line x1="16" y1="28" x2="16" y2="30" />
                        <line x1="2" y1="16" x2="4" y2="16" />
                        <line x1="28" y1="16" x2="30" y2="16" />
                        <line x1="5.66" y1="5.66" x2="6.83" y2="6.83" />
                        <line x1="25.17" y1="25.17" x2="26.34" y2="26.34" />
                        <line x1="5.66" y1="26.34" x2="6.83" y2="25.17" />
                        <line x1="25.17" y1="6.83" x2="26.34" y2="5.66" />
                    </g>
                    {/* Sun center */}
                    <circle
                        cx="16"
                        cy="16"
                        r={svgSize === '32' ? '6' : '8'}
                        fill="currentColor"
                        className="text-orange-400"
                    />
                    {/* Inner glow */}
                    <circle
                        cx="16"
                        cy="16"
                        r={svgSize === '32' ? '4' : '6'}
                        fill="currentColor"
                        className="text-orange-300"
                    />
                </svg>
            </div>

            <div className="flex flex-col leading-none">
                <h2 className={cn('font-bold tracking-wider text-white', textSize)}>Dawn</h2>
                <div className={cn('flex items-center gap-1', size === 'md' ? 'gap-1' : 'gap-2')}>
                    <span className={cn('text-xs text-gray-400', poweredBySize)}>powered by</span>
                    <img src="/midnight-logo.png" alt="Midnight logo" className={cn('w-18', imgSize)} />
                </div>
            </div>
        </div>
    )
}
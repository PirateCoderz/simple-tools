"use client";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/background.jpg')" }}
            />

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
                {/* Main Heading */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white">
                    I'm A Hero
                </h1>

                {/* Description */}
                <p className="text-lg sm:text-xl text-white max-w-3xl mx-auto mb-10 leading-relaxed">
                    A Hero Widget is a full browser height section with some featured content and a call to action. Add a custom background color, image or video to the hero widget.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button className="px-8 py-3 text-base font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded transition-colors shadow-lg">
                        Get More
                    </button>
                    <button className="px-8 py-3 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 rounded transition-colors shadow-lg">
                        See More
                    </button>
                </div>
            </div>
        </section>
    );
}

import LoadingImage from "../../../../public/images/loader.gif";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Image
        src={LoadingImage}
        alt="Nodding head doge"
        unoptimized
      />
    </div>
  );
}

import { useEffect } from "react";
import toast from "react-hot-toast";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import "../styles/Banner.css";
/**
 * Hook to show a banner message that can be dismissed and remembered.
 *
 * @param {string} message - The message to display in the banner
 * @param {string} localStorageKey - The key to use for localStorage to remember if the banner was dismissed
 */
export function useBanner(message, localStorageKey) {
  useEffect(() => {
    const checkAndShowBanner = () => {
      const bannerData = localStorage.getItem(localStorageKey);
      const currentTime = new Date().getTime();
      
      if (bannerData) {
        const { dismissedAt } = JSON.parse(bannerData);
        const timeAgo = 24 * 60 * 60 * 1000;
        const timeSinceDismissal = currentTime - dismissedAt;

        // If it's been more than a day, remove the storage and show banner again
        if (timeSinceDismissal > timeAgo) {
          localStorage.removeItem(localStorageKey);
          showBanner();
        }
      } else {
        showBanner();
      }
    };

    const showBanner = () => {
      toast(
        (t) => (
          <div className="toast-wrapper">
            <div className="toast-header">
              <div className="toast-header-left">
                <h1>Important</h1>
              </div>

              <button
                onClick={() => {
                  const dismissData = {
                    dismissedAt: new Date().getTime(),
                  };
                  localStorage.setItem(localStorageKey, JSON.stringify(dismissData));
                  toast.dismiss(t.id);
                }}
                className="toast-close"
              >
                <IoCheckmarkDoneSharp />
              </button>
            </div>
            <span className="toast-message">{message}</span>
          </div>
        ),
        {
          duration: Infinity,
          position: "bottom-right",
        }
      );
    };

    checkAndShowBanner();
  }, [message, localStorageKey]);
}

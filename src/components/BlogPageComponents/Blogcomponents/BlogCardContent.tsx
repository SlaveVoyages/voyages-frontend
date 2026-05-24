import ReactHtmlParser from 'html-react-parser';
import { useSelector } from 'react-redux';

import { RootState } from '@/redux/store';
import { BlogDataProps } from '@/share/InterfaceTypesBlog';

const BlogCardContent = () => {
  const post = useSelector(
    (state: RootState) => state.getBlogData.post as BlogDataProps,
  );
  const { content } = post;

  return (
    <div className="card-content-body">
      {content ? ReactHtmlParser(content) : null}
    </div>
  );
};
export default BlogCardContent;

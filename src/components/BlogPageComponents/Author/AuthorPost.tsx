import { useEffect, useRef } from 'react';

import { Divider } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { fetchAuthorData } from '@/fetch/blogFetch/fetchAuthorData';
import { setAuthorData, setAuthorPost } from '@/redux/getBlogDataSlice';
import { AppDispatch } from '@/redux/store';
import { BlogDataPropsRequest, BlogFilter } from '@/share/InterfaceTypesBlog';

import AuthorInfo from './AuthorInfo';
import AuthorPostList from './AuthorPostList';

import '@/style/blogs.scss';

const AuthorPost: React.FC = () => {
  const { ID } = useParams();
  const dispatch: AppDispatch = useDispatch();
  const effectOnce = useRef(false);
  const fetchDataBlog = async () => {
    const filters: BlogFilter[] = [];
    const parsedID = ID ? parseInt(ID) : NaN;
    if (!isNaN(parsedID)) {
      filters.push({
        varName: 'id',
        searchTerm: [parsedID],
        op: 'in',
      });
    }
    const dataSend: BlogDataPropsRequest = {
      filter: filters || [],
    };
    try {
      const response = await dispatch(fetchAuthorData(dataSend)).unwrap();
      if (response) {
        dispatch(setAuthorData(response?.results[0]));
        dispatch(setAuthorPost(response?.results[0]?.posts));
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  useEffect(() => {
    if (!effectOnce.current) {
      fetchDataBlog();
    }
  }, [dispatch, ID]);

  return (
    <>
      <AuthorInfo />
      <Divider />
      <AuthorPostList />
    </>
  );
};
export default AuthorPost;
